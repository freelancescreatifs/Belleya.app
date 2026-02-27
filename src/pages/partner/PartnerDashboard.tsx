import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  AffiliateData,
  LeaderboardEntry,
  ZoneRougeEntry,
  getEffectiveCommissionRate,
  loadAffiliateData,
  loadLeaderboards,
} from '../../lib/affiliateHelpers';
import DashboardHeader from '../../components/partner/DashboardHeader';
import PendingState from '../../components/partner/PendingState';
import LevelCard from '../../components/partner/LevelCard';
import AffiliateLinkCard from '../../components/partner/AffiliateLinkCard';
import KPICards from '../../components/partner/KPICards';
import StatusBanner from '../../components/partner/StatusBanner';
import LeaderboardCard from '../../components/partner/LeaderboardCard';
import ZoneRougeCard from '../../components/partner/ZoneRougeCard';
import SubscriptionsTable from '../../components/partner/SubscriptionsTable';
import CommissionsTable from '../../components/partner/CommissionsTable';
import MonthlyGoalCard from '../../components/partner/MonthlyGoalCard';

interface ApplicationData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface SubscriptionRow {
  id: string;
  first_name: string;
  city: string;
  created_at: string;
  status: string;
}

interface CommissionRow {
  id: string;
  period: string;
  mrr: number;
  commission_amount: number;
  status: string;
}

export default function PartnerDashboard() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);

  const [kpis, setKpis] = useState({
    activeSubs: 0,
    mrr: 0,
    currentCommission: 0,
    totalSignups: 0,
  });
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [zoneRouge, setZoneRouge] = useState<ZoneRougeEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const { application: appData, affiliate: affData } = await loadAffiliateData(user.id);
      setApplication(appData);

      if (!appData || appData.status !== 'approved' || !affData) {
        setLoading(false);
        return;
      }

      setAffiliate(affData);

      const { data: codesData } = await supabase
        .from('affiliate_codes')
        .select('id')
        .eq('user_id', user.id);

      const codeIds = (codesData || []).map(c => c.id);

      if (codeIds.length > 0) {
        const { data: subsData } = await supabase
          .from('affiliate_subscriptions')
          .select('*')
          .in('affiliate_code_id', codeIds);

        const subs = subsData || [];
        const activeSubs = subs.filter(s => s.subscription_status === 'active');
        const mrr = activeSubs.reduce((sum: number, s: any) => sum + Number(s.monthly_amount || 0), 0);

        setKpis(prev => ({
          ...prev,
          activeSubs: activeSubs.length,
          mrr,
          totalSignups: subs.length,
        }));

        setSubscriptions(subs.map((s: any) => ({
          id: s.id,
          first_name: 'Filleul(e)',
          city: '-',
          created_at: s.created_at || s.subscription_start_date,
          status: s.subscription_status,
        })));
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: commData } = await supabase
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affData.id)
        .order('period', { ascending: false });

      if (commData) {
        setCommissions(commData.map((c: any) => ({
          id: c.id,
          period: c.period,
          mrr: Number(c.mrr),
          commission_amount: Number(c.commission_amount),
          status: c.status,
        })));

        const currentMonthComm = commData
          .filter((c: any) => c.period === currentMonth)
          .reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);

        setKpis(prev => ({ ...prev, currentCommission: currentMonthComm }));
      }

      const leaderboards = await loadLeaderboards(affData.id);
      setDailyLeaderboard(leaderboards.daily);
      setMonthlyLeaderboard(leaderboards.monthly);
      setZoneRouge(leaderboards.zoneRouge);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/partenaire';
  };

  if (!user) {
    window.location.href = '/login?redirect=/partner/dashboard';
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d9629b]" />
      </div>
    );
  }

  if (!application) {
    return <PendingState status="none" onSignOut={handleSignOut} />;
  }

  if (application.status === 'pending') {
    return <PendingState status="pending" createdAt={application.created_at} onSignOut={handleSignOut} />;
  }

  if (application.status === 'rejected') {
    return <PendingState status="rejected" onSignOut={handleSignOut} />;
  }

  if (!affiliate) {
    return <PendingState status="pending" createdAt={application.created_at} onSignOut={handleSignOut} />;
  }

  const commissionRate = getEffectiveCommissionRate(affiliate);
  const daysSinceLastSignup = affiliate.last_signup_date
    ? Math.floor((Date.now() - new Date(affiliate.last_signup_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader onSignOut={handleSignOut} />

      <div className="container mx-auto px-4 py-6 md:py-10 space-y-6">
        <StatusBanner
          affiliateStatus={affiliate.status}
          daysSinceLastSignup={daysSinceLastSignup}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <LevelCard affiliate={affiliate} />
          <AffiliateLinkCard affiliate={affiliate} />
        </div>

        <KPICards
          activeSubs={kpis.activeSubs}
          mrr={kpis.mrr}
          currentCommission={kpis.currentCommission}
          totalSignups={kpis.totalSignups}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <LeaderboardCard
            title="Leaderboard du jour"
            subtitle="Top 10 - Inscriptions"
            entries={dailyLeaderboard}
            unit="inscrits"
          />
          <LeaderboardCard
            title="Leaderboard du mois"
            subtitle="Top 10 - Commissions"
            entries={monthlyLeaderboard}
            unit="EUR"
          />
        </div>

        <ZoneRougeCard entries={zoneRouge} />

        <SubscriptionsTable subscriptions={subscriptions} />

        <CommissionsTable
          commissions={commissions}
          commissionRate={commissionRate}
        />

        <MonthlyGoalCard totalSignups={kpis.totalSignups} />
      </div>
    </div>
  );
}
