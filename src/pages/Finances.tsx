import { useEffect, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Search, Trash2, ChevronLeft, ChevronRight, User as UserIcon, X, Pencil, Upload, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getServiceTypeTag, type ServiceType } from '../lib/serviceTypeHelpers';
import ImportTransactionsModal from '../components/finances/ImportTransactionsModal';
import RevenueForm from '../components/finances/RevenueForm';
import StudentForm from '../components/training/StudentForm';
import SupplementsDisplay from '../components/shared/SupplementsDisplay';

type PeriodFilter = 'day' | 'month' | 'year';
type PaymentFilter = 'all' | 'cash' | 'card' | 'transfer' | 'paypal' | 'other';
type ServiceTypeFilter = 'all' | ServiceType;

interface Revenue {
  id: string;
  date: string;
  amount: number;
  revenue_type: string;
  payment_method: string;
  service_name: string | null;
  product_name: string | null;
  notes: string | null;
  client_id: string | null;
  student_id?: string | null;
  service_type?: ServiceType;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  supplier: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  service_type: ServiceType;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}

export default function Finances() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses'>('revenues');
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilter>('all');
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [quickClientForm, setQuickClientForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });
  const [preSelectedClientId, setPreSelectedClientId] = useState<string | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [preselectedFormationId, setPreselectedFormationId] = useState<string | null>(null);
  const [pendingStudentCallback, setPendingStudentCallback] = useState<((studentId: string) => void) | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);

  const [revenueForm, setRevenueForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    revenue_type: 'service',
    payment_method: '',
    service_id: '',
    service_name: '',
    product_name: '',
    client_id: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState({
    payment_method: false,
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: 'consumables',
    description: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [user, periodFilter, selectedDate]);

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

  const loadData = async () => {
    if (!user) return;

    try {
      const { start, end } = getDateRange();

      const [revenuesRes, expensesRes, servicesRes, clientsRes, studentsRes, supplementsRes] = await Promise.all([
        supabase
          .from('revenues')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .gte('date', start)
          .lte('date', end)
          .order('date', { ascending: false }),
        supabase.from('services').select('id, name, price, category, service_type').eq('user_id', user.id).in('status', ['active', 'hidden']).order('name'),
        supabase.from('clients').select('id, first_name, last_name, phone, email').order('first_name'),
        supabase.from('students').select('id, first_name, last_name, phone, email').order('first_name'),
        supabase.from('revenue_supplements')
          .select('revenue_id, supplement_id, price_at_time, supplement_name, duration_minutes')
          .order('created_at'),
      ]);

      const servicesData = servicesRes.data || [];
      const supplementsData = supplementsRes.data || [];

      const supplementsByRevenue = supplementsData.reduce((acc, supp: any) => {
        if (!acc[supp.revenue_id]) {
          acc[supp.revenue_id] = [];
        }
        acc[supp.revenue_id].push({
          id: supp.supplement_id,
          name: supp.supplement_name || '',
          price: supp.price_at_time,
          duration_minutes: supp.duration_minutes || 0
        });
        return acc;
      }, {} as Record<string, any[]>);

      const revenuesData = (revenuesRes.data || []).map(revenue => {
        const matchedService = servicesData.find(s => s.name === revenue.service_name);
        const revenueTypeToServiceType: Record<string, ServiceType> = {
          'service': 'prestation',
          'formation': 'formation',
          'digital_sale': 'digital_sale',
          'commission': 'commission',
          'other': 'other'
        };
        return {
          ...revenue,
          service_type: matchedService?.service_type || revenueTypeToServiceType[revenue.revenue_type] || 'prestation',
          supplements: supplementsByRevenue[revenue.id] || []
        };
      });

      setRevenues(revenuesData);
      setExpenses(expensesRes.data || []);
      setServices(servicesData);
      setClients(clientsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === 'other') {
      setRevenueForm({
        ...revenueForm,
        service_id: 'other',
        service_name: '',
        amount: '',
      });
    } else {
      const selectedService = services.find(s => s.id === serviceId);
      if (selectedService) {
        setRevenueForm({
          ...revenueForm,
          service_id: serviceId,
          service_name: selectedService.name,
          amount: selectedService.price.toString(),
        });
      }
    }
  };

  const handleQuickCreateClient = async () => {
    if (!user || !quickClientForm.first_name || !quickClientForm.last_name) {
      alert('Prénom et nom requis');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          first_name: quickClientForm.first_name,
          last_name: quickClientForm.last_name,
          phone: quickClientForm.phone || null,
          email: quickClientForm.email || null,
        })
        .select()
        .single();

      if (error) throw error;

      setClients([...clients, data]);
      setRevenueForm({ ...revenueForm, client_id: data.id });
      setClientSearch(`${data.first_name} ${data.last_name}`);
      setShowQuickClientModal(false);
      setQuickClientForm({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
      });
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Erreur lors de la création de la cliente');
    }
  };

  const handleCreateStudent = (formationId: string | undefined, onCreated: (studentId: string, studentName: string) => void) => {
    console.log('[Finances] Opening student form with formation:', formationId);
    setPreselectedFormationId(formationId || null);
    setPendingStudentCallback(() => onCreated);
    setShowStudentForm(true);
  };

  const handleStudentCreated = async (studentId: string) => {
    console.log('[Finances] Student created:', studentId);

    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('id', studentId)
        .maybeSingle();

      if (studentData && pendingStudentCallback) {
        const studentName = `${studentData.first_name} ${studentData.last_name}`;
        pendingStudentCallback(studentId, studentName);
        setPendingStudentCallback(null);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    }

    loadData();
    setShowStudentForm(false);
  };

  useEffect(() => {
    if (preSelectedClientId) {
      const client = clients.find(c => c.id === preSelectedClientId);
      if (client) {
        setRevenueForm({ ...revenueForm, client_id: client.id });
        setClientSearch(`${client.first_name} ${client.last_name}`);
      }
      setPreSelectedClientId(null);
      setShowAddModal(true);
    }
  }, [preSelectedClientId, clients]);

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!revenueForm.payment_method) {
      setFormErrors({ payment_method: true });
      const errorField = document.getElementById('payment-method-field');
      errorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormErrors({ payment_method: false });

    try {
      const { error } = await supabase.from('revenues').insert({
        user_id: user!.id,
        date: revenueForm.date,
        amount: parseFloat(revenueForm.amount),
        revenue_type: revenueForm.revenue_type,
        payment_method: revenueForm.payment_method,
        service_name: revenueForm.service_name || null,
        product_name: revenueForm.product_name || null,
        client_id: revenueForm.client_id || null,
        notes: revenueForm.notes || null,
      });

      if (error) {
        console.error('Error details:', error);
        alert('Erreur lors de l\'ajout : ' + error.message);
        throw error;
      }

      setShowAddModal(false);
      setRevenueForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        revenue_type: 'service',
        payment_method: '',
        service_id: '',
        service_name: '',
        product_name: '',
        client_id: '',
        notes: '',
      });
      setFormErrors({ payment_method: false });
      setClientSearch('');
      loadData();
    } catch (error) {
      console.error('Error adding revenue:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: user!.id,
        date: expenseForm.date,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        supplier: expenseForm.supplier || null,
        notes: expenseForm.notes || null,
      });

      if (error) throw error;

      setShowAddModal(false);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'consumables',
        description: '',
        supplier: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          date: expenseForm.date,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          description: expenseForm.description,
          supplier: expenseForm.supplier || null,
          notes: expenseForm.notes || null,
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      setShowEditExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'consumables',
        description: '',
        supplier: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error editing expense:', error);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return;

    try {
      const { error } = await supabase.from('revenues').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting revenue:', error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
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

  const getDisplayDate = () => {
    if (periodFilter === 'day') {
      return selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } else if (periodFilter === 'month') {
      return selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    return selectedDate.getFullYear().toString();
  };

  const filteredRevenues = revenues.filter(r => {
    const matchesPayment = paymentFilter === 'all' || r.payment_method === paymentFilter;
    const matchesServiceType = serviceTypeFilter === 'all' || r.service_type === serviceTypeFilter;
    return matchesPayment && matchesServiceType;
  });

  const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const filteredTotalRevenues = filteredRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalRevenues - totalExpenses;

  const revenueTypeLabels: Record<string, string> = {
    service: 'Prestation',
    formation: 'Formation',
    digital_sale: 'Vente digitale',
    commission: 'Commission',
    other: 'Autre',
  };

  const categoryLabels: Record<string, string> = {
    consumables: 'Consommables',
    equipment: 'Matériel',
    fixed_costs: 'Charges fixes',
    training: 'Formation',
    investment: 'Investissement',
    other: 'Autre',
  };

  const paymentMethodLabels: Record<string, string> = {
    card: 'Carte',
    cash: 'Espèces',
    paypal: 'PayPal',
    transfer: 'Virement',
    other: 'Autre',
  };

  const paymentMethodEmojis: Record<string, string> = {
    card: '💳',
    cash: '💵',
    paypal: '🅿️',
    transfer: '🏦',
    other: '💰',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
      <div className="mb-6 lg:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Transactions</h1>
            <p className="text-sm lg:text-base text-gray-600">Suivez vos recettes et dépenses</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setPeriodFilter('day')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  periodFilter === 'day'
                    ? 'bg-belaya-100 text-belaya-600 border border-belaya-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setPeriodFilter('month')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  periodFilter === 'month'
                    ? 'bg-belaya-100 text-belaya-600 border border-belaya-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setPeriodFilter('year')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                  periodFilter === 'year'
                    ? 'bg-belaya-100 text-belaya-600 border border-belaya-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Année
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-sm font-medium text-gray-900 min-w-[100px] lg:min-w-[150px] text-center">
                {getDisplayDate()}
              </span>
              <button
                onClick={() => handleDateChange('next')}
                disabled={selectedDate >= new Date()}
                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white border-2 border-belaya-500 text-belaya-500 rounded-lg hover:bg-belaya-50 transition-all shadow-sm"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Importer</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-400 text-white rounded-lg hover:from-rose-600 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                {activeTab === 'revenues' ? 'Nouvelle recette' : 'Nouvelle dépense'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-belaya-bright" />
            </div>
            <p className="text-sm text-gray-600">
              {paymentFilter === 'all' && serviceTypeFilter === 'all' ? 'Total Recettes' : 'Recettes filtrées'}
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredTotalRevenues.toFixed(2)} €</p>
          {(paymentFilter !== 'all' || serviceTypeFilter !== 'all') && (
            <p className="text-xs text-gray-500 mt-1">Total global : {totalRevenues.toFixed(2)} €</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">Total Dépenses</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalExpenses.toFixed(2)} €</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 ${balance >= 0 ? 'bg-blue-50' : 'bg-red-50'} rounded-xl flex items-center justify-center`}>
              <TrendingUp className={`w-5 h-5 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
            </div>
            <p className="text-sm text-gray-600">Bénéfice</p>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {balance.toFixed(2)} €
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('revenues')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'revenues'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Recettes
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'text-[#C43586] border-b-2 border-[#C43586]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dépenses
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'revenues' ? (
            <>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Type de service :</span>
                <button
                  onClick={() => setServiceTypeFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'all'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setServiceTypeFilter('prestation')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'prestation'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Prestation
                </button>
                <button
                  onClick={() => setServiceTypeFilter('formation')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'formation'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Formation
                </button>
                <button
                  onClick={() => setServiceTypeFilter('digital_sale')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'digital_sale'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vente digitale
                </button>
                <button
                  onClick={() => setServiceTypeFilter('commission')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'commission'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Commission
                </button>
                <button
                  onClick={() => setServiceTypeFilter('other')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    serviceTypeFilter === 'other'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Autre
                </button>
              </div>

              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Mode de paiement :</span>
                <button
                  onClick={() => setPaymentFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'all'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setPaymentFilter('card')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'card'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💳 Carte
                </button>
                <button
                  onClick={() => setPaymentFilter('cash')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'cash'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💵 Espèces
                </button>
                <button
                  onClick={() => setPaymentFilter('transfer')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'transfer'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🏦 Virement
                </button>
                <button
                  onClick={() => setPaymentFilter('other')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paymentFilter === 'other'
                      ? 'bg-belaya-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 Autre
                </button>
              </div>
              <div className="space-y-3">
              {filteredRevenues.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {paymentFilter === 'all' && serviceTypeFilter === 'all'
                    ? 'Aucune recette enregistrée'
                    : `Aucune recette avec les filtres sélectionnés`}
                </p>
              ) : (
                filteredRevenues.map((revenue) => {
                  const client = revenue.client_id ? clients.find(c => c.id === revenue.client_id) : null;
                  const student = revenue.student_id ? students.find(s => s.id === revenue.student_id) : null;
                  return (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium text-gray-900">
                            {revenue.service_name || revenue.product_name || 'Sans titre'}
                          </p>
                          {revenue.service_type ? (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getServiceTypeTag(revenue.service_type).className}`}>
                              {getServiceTypeTag(revenue.service_type).label}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {revenueTypeLabels[revenue.revenue_type]}
                            </span>
                          )}
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                            {paymentMethodEmojis[revenue.payment_method] || '💰'} {paymentMethodLabels[revenue.payment_method] || revenue.payment_method}
                          </span>
                          {client && (
                            <span className="px-3 py-1 bg-belaya-50 text-belaya-deep text-xs rounded-lg font-medium flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              {client.first_name} {client.last_name}
                            </span>
                          )}
                          {student && (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {student.first_name} {student.last_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-600">{revenue.date}</p>
                        </div>
                        {revenue.supplements && revenue.supplements.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <SupplementsDisplay
                              supplements={revenue.supplements}
                              serviceType={revenue.service_type || 'prestation'}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold text-belaya-bright">
                          +{revenue.amount} €
                        </p>
                        <button
                          onClick={() => {
                            setEditingRevenue(revenue);
                            setShowEditModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-100 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteRevenue(revenue.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {expenses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucune dépense enregistrée</p>
              ) : (
                expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {categoryLabels[expense.category]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{expense.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-semibold text-orange-600">-{expense.amount} €</p>
                      <button
                        onClick={() => {
                          setEditingExpense(expense);
                          setExpenseForm({
                            date: expense.date,
                            amount: expense.amount.toString(),
                            category: expense.category,
                            description: expense.description,
                            supplier: expense.supplier || '',
                            notes: '',
                          });
                          setShowEditExpenseModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-100 rounded-lg transition-all"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-lg transition-all"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && activeTab === 'expenses' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nouvelle dépense</h2>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  >
                    <option value="consumables">Consommables</option>
                    <option value="equipment">Matériel</option>
                    <option value="fixed_costs">Charges fixes</option>
                    <option value="training">Formation</option>
                    <option value="investment">Investissement</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={expenseForm.supplier}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {showEditExpenseModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Modifier la dépense</h2>
            </div>

            <form onSubmit={handleEditExpense} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  >
                    <option value="consumables">Consommables</option>
                    <option value="equipment">Matériel</option>
                    <option value="fixed_costs">Charges fixes</option>
                    <option value="training">Formation</option>
                    <option value="investment">Investissement</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={expenseForm.supplier}
                    onChange={(e) => setExpenseForm({ ...expenseForm, supplier: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditExpenseModal(false);
                      setEditingExpense(null);
                      setExpenseForm({
                        date: new Date().toISOString().split('T')[0],
                        amount: '',
                        category: 'consumables',
                        description: '',
                        supplier: '',
                        notes: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {showStudentForm && (
        <StudentForm
          onClose={() => {
            setShowStudentForm(false);
            setPreselectedFormationId(null);
            setPendingStudentCallback(null);
          }}
          onSuccess={() => {}}
          onStudentCreated={handleStudentCreated}
          preselectedFormationId={preselectedFormationId || undefined}
          hideFormationField={!!preselectedFormationId}
        />
      )}

      {showAddModal && activeTab === 'revenues' && (
        <RevenueForm
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          onCreateClient={() => setShowQuickClientModal(true)}
          onCreateStudent={handleCreateStudent}
        />
      )}


      {showEditModal && editingRevenue && (
        <RevenueForm
          revenueId={editingRevenue.id}
          onClose={() => {
            setShowEditModal(false);
            setEditingRevenue(null);
          }}
          onSuccess={loadData}
          onCreateClient={() => setShowQuickClientModal(true)}
          onCreateStudent={handleCreateStudent}
        />
      )}


      {showQuickClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Nouvelle cliente</h2>
              <button
                onClick={() => setShowQuickClientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickClientForm.first_name}
                    onChange={(e) => setQuickClientForm({ ...quickClientForm, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickClientForm.last_name}
                    onChange={(e) => setQuickClientForm({ ...quickClientForm, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={quickClientForm.phone}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={quickClientForm.email}
                  onChange={(e) => setQuickClientForm({ ...quickClientForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-belaya-primary focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowQuickClientModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleQuickCreateClient}
                  disabled={!quickClientForm.first_name || !quickClientForm.last_name}
                  className="flex-1 px-4 py-2 bg-belaya-500 text-white rounded-lg hover:bg-belaya-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportTransactionsModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={loadData}
        />
      )}

      <button
        onClick={() => setShowAddModal(true)}
        className="lg:hidden fixed right-4 bottom-24 z-40 w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-400 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all active:scale-95"
        aria-label={activeTab === 'revenues' ? 'Nouvelle recette' : 'Nouvelle dépense'}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
