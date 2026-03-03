import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Users, Euro, Package, Calendar, Calculator, Receipt, FileText, Building, AlertCircle, ChevronLeft, ChevronRight, Filter, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AlertCard from '../components/shared/AlertCard';
import EducationalCard from '../components/shared/EducationalCard';
import TaxCalculator from '../components/dashboard/TaxCalculator';
import InfoTooltip from '../components/shared/InfoTooltip';
import BookingNotifications from '../components/dashboard/BookingNotifications';
import SubscriptionBadge from '../components/shared/SubscriptionBadge';

type PeriodFilter = 'day' | 'month' | 'year';

interface Stats {
  totalClients: number;
  revenue: number;
  expenses: number;
  lowStock: number;
  upcomingTasks: number;
  avgMonthlyRevenue: number;
  urssafCharges: number;
  currentMonthRevenue: number;
  currentMonthExpenses: number;
}

interface RevenueTypeData {
  revenue_type: string;
  label: string;
  total: number;
  color: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

interface EducationalContent {
  id: string;
  title: string;
  content: string;
  icon: string;
}

interface CompanyProfile {
  legal_status: string;
  acre: boolean;
  vat_mode: string;
  tax_category: string;
  versement_liberatoire: boolean;
  creation_date: string;
}

interface DashboardProps {
  onPageChange: (page: string) => void;
}

export default function Dashboard({ onPageChange }: DashboardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    revenue: 0,
    expenses: 0,
    lowStock: 0,
    upcomingTasks: 0,
    avgMonthlyRevenue: 0,
    urssafCharges: 0,
    currentMonthRevenue: 0,
    currentMonthExpenses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [educationalContent, setEducationalContent] = useState<EducationalContent[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [revenueTypeData, setRevenueTypeData] = useState<RevenueTypeData[]>([]);
  const [periodTotal, setPeriodTotal] = useState(0);
  const [userPlan, setUserPlan] = useState<'start' | 'studio' | 'empire' | 'vip' | null>(null);

  useEffect(() => {
    loadStats();
    loadCompanyProfile();
    loadRevenuesByType();
    loadUserPlan();
  }, [user, periodFilter, selectedDate]);

  useEffect(() => {
    loadMonthlyData();
  }, [user, selectedYear]);

  const getDateRange = () => {
    const start = new Date(selectedDate);
    const end = new Date(selectedDate);

    if (periodFilter === 'day') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else if (periodFilter === 'year') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const loadUserPlan = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData?.company_id) {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('plan_type')
          .eq('company_id', profileData.company_id)
          .maybeSingle();

        if (subscriptionData?.plan_type) {
          setUserPlan(subscriptionData.plan_type as 'start' | 'studio' | 'empire' | 'vip');
        }
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const { start, end } = getDateRange();

      const [clientsRes, revenuesRes, expensesRes, stockRes, tasksRes, avgRevenuesRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase
          .from('revenues')
          .select('amount')
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('expenses')
          .select('amount')
          .gte('date', start)
          .lte('date', end),
        supabase
          .from('stock_items')
          .select('id', { count: 'exact' })
          .eq('status', 'low'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .eq('completed', false),
        supabase
          .from('revenues')
          .select('date, amount'),
      ]);

      const revenue = revenuesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const expenses = expensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const monthlyRevenues = new Map<string, number>();
      avgRevenuesRes.data?.forEach((r) => {
        const yearMonth = r.date.substring(0, 7);
        const current = monthlyRevenues.get(yearMonth) || 0;
        monthlyRevenues.set(yearMonth, current + Number(r.amount));
      });

      const avgMonthlyRevenue = monthlyRevenues.size > 0
        ? Array.from(monthlyRevenues.values()).reduce((sum, val) => sum + val, 0) / monthlyRevenues.size
        : 0;

      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      const currentMonthEnd = new Date();
      currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
      currentMonthEnd.setDate(0);
      currentMonthEnd.setHours(23, 59, 59, 999);

      const [monthRevenuesRes, monthExpensesRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('amount')
          .gte('date', currentMonthStart.toISOString().split('T')[0])
          .lte('date', currentMonthEnd.toISOString().split('T')[0]),
        supabase
          .from('expenses')
          .select('amount')
          .gte('date', currentMonthStart.toISOString().split('T')[0])
          .lte('date', currentMonthEnd.toISOString().split('T')[0]),
      ]);

      const currentMonthRevenue = monthRevenuesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const currentMonthExpenses = monthExpensesRes.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const urssafRate = 0.22;
      const urssafCharges = currentMonthRevenue * urssafRate;

      setStats({
        totalClients: clientsRes.count || 0,
        revenue,
        expenses,
        lowStock: stockRes.count || 0,
        upcomingTasks: tasksRes.count || 0,
        avgMonthlyRevenue,
        urssafCharges,
        currentMonthRevenue,
        currentMonthExpenses,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    if (!user) return;

    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const [revenuesRes, expensesRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('date, amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('expenses')
          .select('date, amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
      ]);

      const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

      for (let i = 0; i < 12; i++) {
        const yearMonth = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
        monthlyMap.set(yearMonth, { revenue: 0, expenses: 0 });
      }

      revenuesRes.data?.forEach((r) => {
        const yearMonth = r.date.substring(0, 7);
        const current = monthlyMap.get(yearMonth);
        if (current) {
          current.revenue += Number(r.amount);
        }
      });

      expensesRes.data?.forEach((e) => {
        const yearMonth = e.date.substring(0, 7);
        const current = monthlyMap.get(yearMonth);
        if (current) {
          current.expenses += Number(e.amount);
        }
      });

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const data = Array.from(monthlyMap.entries()).map(([yearMonth, values], index) => {
        return {
          month: monthNames[index],
          revenue: values.revenue,
          expenses: values.expenses,
        };
      });

      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    }
  };

  const loadRevenuesByType = async () => {
    if (!user) return;

    try {
      const { start, end } = getDateRange();

      const { data: revenues } = await supabase
        .from('revenues')
        .select('revenue_type, amount')
        .gte('date', start)
        .lte('date', end)
        .eq('user_id', user.id);

      if (revenues) {
        const typeMap = new Map<string, number>();
        let total = 0;

        revenues.forEach((rev) => {
          const amount = Number(rev.amount);
          total += amount;

          if (rev.revenue_type) {
            const current = typeMap.get(rev.revenue_type) || 0;
            typeMap.set(rev.revenue_type, current + amount);
          }
        });

        setPeriodTotal(total);

        const typeLabels: Record<string, string> = {
          'prestation': 'Prestation',
          'formation': 'Formation',
          'digital_sale': 'Vente digitale',
          'commission': 'Commission',
          'other': 'Autre',
        };

        const typeColors: Record<string, string> = {
          'prestation': 'rgb(236, 72, 153)',
          'formation': 'rgb(59, 130, 246)',
          'digital_sale': 'rgb(168, 85, 247)',
          'commission': 'rgb(34, 197, 94)',
          'other': 'rgb(234, 179, 8)',
        };

        const revenueData: RevenueTypeData[] = Array.from(typeMap.entries())
          .map(([type, total]) => ({
            revenue_type: type,
            label: typeLabels[type] || type,
            total: total,
            color: typeColors[type] || 'rgb(156, 163, 175)',
          }))
          .filter(item => item.total > 0)
          .sort((a, b) => b.total - a.total);

        setRevenueTypeData(revenueData);
      }
    } catch (error) {
      console.error('Error loading revenues by type:', error);
    }
  };

  const loadCompanyProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('legal_status, acre, vat_mode, tax_category, versement_liberatoire, creation_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setCompanyProfile(profile);
        await loadEducationalContent(profile.legal_status);
        await generateAlerts(profile);
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const loadEducationalContent = async (legalStatus: string) => {
    try {
      const { data } = await supabase
        .from('educational_content')
        .select('*')
        .contains('legal_statuses', [legalStatus]);

      if (data) {
        setEducationalContent(data);
      }
    } catch (error) {
      console.error('Error loading educational content:', error);
    }
  };

  const generateAlerts = async (profile: CompanyProfile) => {
    if (!user) return;

    const newAlerts: Alert[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    try {
      const { data: yearRevenues } = await supabase
        .from('revenues')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`);

      const annualRevenue = yearRevenues?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      if (profile.legal_status === 'MICRO') {
        const vatThreshold = 36800;
        const revenueThreshold = 77700;

        if (profile.vat_mode === 'VAT_FRANCHISE' && annualRevenue > vatThreshold) {
          newAlerts.push({
            id: 'vat_threshold',
            title: 'Seuil de franchise TVA dépassé',
            message: `Votre CA annuel (${annualRevenue.toFixed(2)}€) a dépassé le seuil de franchise en base de TVA (36 800€). Vous devez facturer la TVA.`,
            priority: 'high',
          });
        }

        if (annualRevenue > revenueThreshold) {
          newAlerts.push({
            id: 'revenue_threshold',
            title: 'Seuil de CA annuel dépassé',
            message: `Votre CA annuel (${annualRevenue.toFixed(2)}€) a dépassé le plafond micro-entreprise (77 700€). Envisagez un changement de statut.`,
            priority: 'high',
          });
        }

        if (profile.acre && profile.creation_date) {
          const creationDate = new Date(profile.creation_date);
          const oneYearAfterCreation = new Date(creationDate);
          oneYearAfterCreation.setFullYear(oneYearAfterCreation.getFullYear() + 1);

          const threeYearsAfterCreation = new Date(creationDate);
          threeYearsAfterCreation.setFullYear(threeYearsAfterCreation.getFullYear() + 3);

          const monthsUntilOneYear = Math.ceil((oneYearAfterCreation.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
          const monthsUntilThreeYears = Math.ceil((threeYearsAfterCreation.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

          if (currentDate >= oneYearAfterCreation && currentDate < threeYearsAfterCreation) {
            if (monthsUntilThreeYears > 0 && monthsUntilThreeYears <= 3) {
              newAlerts.push({
                id: 'accre_ending_soon',
                title: 'ACCRE bientôt terminée',
                message: `Votre ACCRE se termine dans ${monthsUntilThreeYears} mois. Vos charges sociales vont augmenter progressivement pour atteindre le taux normal.`,
                priority: 'high',
              });
            } else {
              newAlerts.push({
                id: 'accre_year_passed',
                title: 'ACCRE : Première année écoulée',
                message: `Un an s'est écoulé depuis la création de votre entreprise. Vos taux de charges ACCRE ont commencé à augmenter progressivement. Vous bénéficiez encore de taux réduits jusqu'à la fin de la 3ème année.`,
                priority: 'medium',
              });
            }
          } else if (currentDate >= threeYearsAfterCreation) {
            newAlerts.push({
              id: 'accre_expired',
              title: 'ACCRE terminée',
              message: `Votre période ACCRE de 3 ans est terminée. Vous payez maintenant les charges sociales au taux normal.`,
              priority: 'medium',
            });
          }
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error generating alerts:', error);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const getIconForContent = (iconName: string) => {
    const icons: Record<string, any> = {
      Calculator,
      Receipt,
      FileText,
      Building,
      TrendingUp,
      TrendingDown,
      Lightbulb,
    };
    return icons[iconName] || AlertCircle;
  };

  const getPeriodLabel = () => {
    if (periodFilter === 'day') return 'du jour';
    if (periodFilter === 'month') return 'du mois';
    return 'de l\'année';
  };

  const firstRowCards = [
    {
      label: 'Total Clientes',
      value: stats.totalClients,
      icon: Users,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: 'clients',
      showAlert: false,
    },
    {
      label: 'Tâches en attente',
      value: stats.upcomingTasks,
      icon: Calendar,
      color: 'from-cyan-400 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      link: 'tasks',
      showAlert: false,
    },
    {
      label: 'Articles à commander',
      value: stats.lowStock,
      icon: Package,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: 'stock',
      showAlert: stats.lowStock > 0,
    },
  ];

  const revenueExpenseCards = [
    {
      label: 'CA du mois',
      value: `${stats.currentMonthRevenue.toFixed(2)} €`,
      icon: TrendingUp,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      tooltip: `Moyenne mensuelle: ${stats.avgMonthlyRevenue.toFixed(2)} €`,
      link: 'finances',
    },
    {
      label: `Revenus ${getPeriodLabel()}`,
      value: `${stats.revenue.toFixed(2)} €`,
      icon: TrendingUp,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: 'finances',
    },
    {
      label: `Dépenses ${getPeriodLabel()}`,
      value: `${stats.expenses.toFixed(2)} €`,
      icon: Euro,
      color: 'from-orange-400 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: 'finances',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">{t('dashboard.loading')}</div>
      </div>
    );
  }

  const allValues = monthlyData.flatMap(d => [d.revenue, d.expenses]).filter(v => v > 0);
  const maxDataValue = allValues.length > 0 ? Math.max(...allValues) : 100;
  const maxValue = maxDataValue * 1.1;

  const formatDateForInput = () => {
    return selectedDate.toISOString().split('T')[0];
  };

  const getDisplayDate = () => {
    if (periodFilter === 'day') {
      return selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (periodFilter === 'month') {
      return selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return selectedDate.getFullYear().toString();
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (periodFilter === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (periodFilter === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
            <SubscriptionBadge planType={userPlan} />
          </div>
          <p className="text-sm sm:text-base text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-full">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setPeriodFilter('day')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'day'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('dashboard.day')}
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'month'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('dashboard.month')}
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  periodFilter === 'year'
                    ? 'bg-[#E51E8F] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('dashboard.year')}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
              <span className="text-xs sm:text-sm font-medium text-gray-900 min-w-[120px] sm:min-w-[150px] text-center">
                {getDisplayDate()}
              </span>
              <button
                onClick={() => handleDateChange('next')}
                disabled={selectedDate >= new Date()}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
              </button>
            </div>
          </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-full">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              title={alert.title}
              message={alert.message}
              priority={alert.priority}
              dueDate={alert.due_date}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}

      <BookingNotifications />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {firstRowCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => onPageChange(card.link)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] relative"
            >
              {card.showAlert && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {revenueExpenseCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => onPageChange(card.link)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-gray-600">{card.label}</p>
                {card.tooltip && <InfoTooltip content={card.tooltip} />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          onClick={() => onPageChange('finances')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-[#E51E8F]/[0.11] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#C43586]" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Bénéfice {getPeriodLabel()}</p>
          <p className="text-2xl font-bold text-gray-900">{(stats.revenue - stats.expenses).toFixed(2)} €</p>
        </div>

        {companyProfile && (
          <TaxCalculator
            legalStatus={companyProfile.legal_status}
            acre={companyProfile.acre}
            vatMode={companyProfile.vat_mode}
            taxCategory={companyProfile.tax_category}
            versementLiberatoire={companyProfile.versement_liberatoire}
            monthRevenue={stats.currentMonthRevenue}
            monthExpenses={stats.currentMonthExpenses}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {monthlyData.length > 0 && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Évolution annuelle</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[80px] text-center">
                  {selectedYear}
                </span>
                <button
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  disabled={selectedYear >= new Date().getFullYear()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative h-96 pt-8 pb-10 border-b border-gray-200">
                <div className="h-full flex items-end justify-between gap-2">
                  {monthlyData.map((data, index) => {
                    const revenueHeight = maxValue > 0 ? (data.revenue / maxValue) * 100 : 0;
                    const expensesHeight = maxValue > 0 ? (data.expenses / maxValue) * 100 : 0;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-3 h-full">
                        <div className="w-full flex items-end justify-center gap-1 relative" style={{ height: 'calc(100% - 24px)' }}>
                          <div className="relative flex-1 flex flex-col justify-end group h-full">
                            {data.revenue > 0 && (
                              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-green-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-lg z-10">
                                {data.revenue.toFixed(0)}€
                              </span>
                            )}
                            <div
                              className="bg-green-500 rounded-t-lg transition-all group-hover:opacity-90 w-full cursor-pointer"
                              style={{
                                height: `${revenueHeight}%`,
                                minHeight: data.revenue > 0 ? '4px' : '0'
                              }}
                            />
                          </div>
                          <div className="relative flex-1 flex flex-col justify-end group h-full">
                            {data.expenses > 0 && (
                              <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-orange-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-lg z-10">
                                {data.expenses.toFixed(0)}€
                              </span>
                            )}
                            <div
                              className="bg-orange-500 rounded-t-lg transition-all group-hover:bg-orange-600 w-full cursor-pointer"
                              style={{
                                height: `${expensesHeight}%`,
                                minHeight: data.expenses > 0 ? '4px' : '0'
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">Revenus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-700">Dépenses</span>
              </div>
            </div>
          </div>
        )}

        {revenueTypeData.length > 0 && (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Revenus par type de recette</h2>
            <div className="mb-6 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-600">Total généré {getPeriodLabel()}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {periodTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </p>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {(() => {
                    const total = revenueTypeData.reduce((sum, s) => sum + s.total, 0);
                    let currentAngle = 0;

                    return revenueTypeData.map((item, index) => {
                      const percentage = (item.total / total) * 100;
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;

                      const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
                      const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
                      const x2 = 100 + 80 * Math.cos((Math.PI * endAngle) / 180);
                      const y2 = 100 + 80 * Math.sin((Math.PI * endAngle) / 180);

                      const largeArcFlag = angle > 180 ? 1 : 0;

                      const pathData = [
                        `M 100 100`,
                        `L ${x1} ${y1}`,
                        `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `Z`,
                      ].join(' ');

                      currentAngle = endAngle;

                      return (
                        <g key={index}>
                          <path
                            d={pathData}
                            fill={item.color}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                          <title>{`${item.label}: ${item.total.toFixed(2)}€ (${percentage.toFixed(1)}%)`}</title>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
            <div className="space-y-3">
              {revenueTypeData.map((item, index) => {
                const total = revenueTypeData.reduce((sum, s) => sum + s.total, 0);
                const percentage = ((item.total / total) * 100).toFixed(1);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700 truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm text-gray-600">
                        {item.total.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </span>
                      <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {educationalContent.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {educationalContent.map((content) => {
            const IconComponent = getIconForContent(content.icon);
            return (
              <EducationalCard
                key={content.id}
                title={content.title}
                content={content.content}
                icon={<IconComponent className="w-5 h-5" />}
              />
            );
          })}
        </div>
      )}

      {!companyProfile && (
        <div className="mt-8 bg-gradient-to-br from-belaya-50 to-belaya-100 rounded-2xl p-6 border border-belaya-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Complétez votre profil d'entreprise</h2>
          <p className="text-gray-700 mb-4">
            Pour bénéficier d'alertes personnalisées, de calculs de charges et de conseils adaptés à votre statut,
            renseignez les informations de votre entreprise dans les paramètres.
          </p>
          <button
            onClick={() => window.location.href = '#settings'}
            className="inline-block px-4 py-2 bg-[#E51E8F] text-white rounded-lg hover:bg-belaya-deep transition-colors"
          >
            Aller aux paramètres
          </button>
        </div>
      )}
    </div>
  );
}
