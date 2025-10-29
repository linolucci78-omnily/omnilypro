/**
 * Admin Memberships Dashboard
 *
 * Global view of all memberships across all organizations
 * for super admin monitoring and management
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  DollarSign,
  Euro,
  Users,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  BarChart3,
  X,
  PlayCircle,
  PauseCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CustomerSubscription, SubscriptionTemplate } from '../../types/subscription';
import PageLoader from '../UI/PageLoader';
import './AdminMembershipsDashboard.css';

interface GlobalStats {
  total_active: number;
  total_paused: number;
  total_expired: number;
  total_cancelled: number;
  total_revenue: number;
  monthly_revenue: number;
  total_usages: number;
  organizations_count: number;
  memberships_this_month: number;
  expiring_soon: number;
}

interface OrganizationSummary {
  organization_id: string;
  organization_name: string;
  total_active: number;
  total_revenue: number;
  template_count: number;
}

const AdminMembershipsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'memberships' | 'templates' | 'stats'>('memberships');
  const [stats, setStats] = useState<GlobalStats>({
    total_active: 0,
    total_paused: 0,
    total_expired: 0,
    total_cancelled: 0,
    total_revenue: 0,
    monthly_revenue: 0,
    total_usages: 0,
    organizations_count: 0,
    memberships_this_month: 0,
    expiring_soon: 0
  });
  const [memberships, setMemberships] = useState<CustomerSubscription[]>([]);
  const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);
  const [orgSummaries, setOrgSummaries] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired' | 'cancelled'>('all');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] = useState<CustomerSubscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGlobalStats(),
        loadMemberships(),
        loadTemplates(),
        loadOrganizationSummaries()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalStats = async () => {
    try {
      console.log('📊 Loading global membership stats...');

      // Load all memberships
      const { data: allMemberships, error: membershipsError } = await supabase
        .from('customer_subscriptions')
        .select('*, organization:organizations(name)');

      if (membershipsError) throw membershipsError;

      // Calculate stats
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const active = allMemberships?.filter(m => m.status === 'active').length || 0;
      const paused = allMemberships?.filter(m => m.status === 'paused').length || 0;
      const expired = allMemberships?.filter(m => m.status === 'expired').length || 0;
      const cancelled = allMemberships?.filter(m => m.status === 'cancelled').length || 0;

      const totalRevenue = allMemberships?.reduce((sum, m) => sum + (m.price || 0), 0) || 0;
      const monthlyRevenue = allMemberships
        ?.filter(m => new Date(m.created_at) >= thisMonth)
        .reduce((sum, m) => sum + (m.price || 0), 0) || 0;

      const totalUsages = allMemberships?.reduce((sum, m) => sum + (m.usage_count || 0), 0) || 0;
      const membershipsThisMonth = allMemberships?.filter(m => new Date(m.created_at) >= thisMonth).length || 0;

      const expiringSoon = allMemberships?.filter(m => {
        const endDate = new Date(m.end_date);
        return m.status === 'active' && endDate <= sevenDaysFromNow && endDate > now;
      }).length || 0;

      // Count unique organizations
      const uniqueOrgs = new Set(allMemberships?.map(m => m.organization_id));

      setStats({
        total_active: active,
        total_paused: paused,
        total_expired: expired,
        total_cancelled: cancelled,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        total_usages: totalUsages,
        organizations_count: uniqueOrgs.size,
        memberships_this_month: membershipsThisMonth,
        expiring_soon: expiringSoon
      });

      console.log('✅ Global stats loaded');
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  const loadMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_subscriptions')
        .select(`
          *,
          organization:organizations(id, name),
          template:subscription_templates(name, duration_value, duration_type),
          customer:customers(name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemberships(data || []);
    } catch (error) {
      console.error('Error loading memberships:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_templates')
        .select('*, organization:organizations(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadOrganizationSummaries = async () => {
    try {
      const { data: allMemberships, error } = await supabase
        .from('customer_subscriptions')
        .select('*, organization:organizations(name)');

      if (error) throw error;

      // Group by organization
      const orgMap = new Map<string, OrganizationSummary>();

      allMemberships?.forEach(membership => {
        const orgId = membership.organization_id;
        const orgName = membership.organization?.name || 'Unknown';

        if (!orgMap.has(orgId)) {
          orgMap.set(orgId, {
            organization_id: orgId,
            organization_name: orgName,
            total_active: 0,
            total_revenue: 0,
            template_count: 0
          });
        }

        const summary = orgMap.get(orgId)!;
        if (membership.status === 'active') {
          summary.total_active++;
        }
        summary.total_revenue += membership.price || 0;
      });

      // Get template counts
      const { data: templateCounts } = await supabase
        .from('subscription_templates')
        .select('organization_id');

      templateCounts?.forEach(t => {
        const summary = orgMap.get(t.organization_id);
        if (summary) {
          summary.template_count++;
        }
      });

      setOrgSummaries(Array.from(orgMap.values()));
    } catch (error) {
      console.error('Error loading organization summaries:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      active: { label: 'Attivo', color: '#10b981', icon: CheckCircle },
      paused: { label: 'In Pausa', color: '#f59e0b', icon: PauseCircle },
      expired: { label: 'Scaduto', color: '#6b7280', icon: Clock },
      cancelled: { label: 'Annullato', color: '#ef4444', icon: XCircle }
    };

    const badge = badges[status] || badges.active;
    const Icon = badge.icon;

    return (
      <span className="status-badge" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  const filteredMemberships = memberships.filter(membership => {
    const matchesSearch =
      membership.subscription_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      membership.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || membership.status === statusFilter;
    const matchesOrg = selectedOrg === 'all' || membership.organization_id === selectedOrg;

    return matchesSearch && matchesStatus && matchesOrg;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = selectedOrg === 'all' || template.organization_id === selectedOrg;
    return matchesSearch && matchesOrg;
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="admin-memberships-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Gestione Membership</h1>
          <p>Panoramica globale di tutte le membership</p>
        </div>
        <button className="btn-download">
          <Download size={18} />
          Esporta Report
        </button>
      </div>

      {/* Global Stats */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Membership Attive</div>
            <div className="stat-value">{stats.total_active}</div>
            <div className="stat-subtitle">
              {stats.memberships_this_month} questo mese
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Euro size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Ricavi Totali</div>
            <div className="stat-value">{formatCurrency(stats.total_revenue)}</div>
            <div className="stat-subtitle">
              {formatCurrency(stats.monthly_revenue)} questo mese
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Utilizzi Totali</div>
            <div className="stat-value">{stats.total_usages}</div>
            <div className="stat-subtitle">
              Da tutte le membership
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Organizzazioni</div>
            <div className="stat-value">{stats.organizations_count}</div>
            <div className="stat-subtitle">
              Con membership attive
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'memberships' ? 'active' : ''}`}
          onClick={() => setActiveTab('memberships')}
        >
          <Package size={18} />
          Tutte le Membership ({memberships.length})
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <BarChart3 size={18} />
          Template ({templates.length})
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <TrendingUp size={18} />
          Statistiche per Organizzazione
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder={activeTab === 'templates' ? "Cerca template..." : "Cerca per codice, cliente o organizzazione..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {activeTab === 'memberships' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Attive</option>
            <option value="paused">In Pausa</option>
            <option value="expired">Scadute</option>
            <option value="cancelled">Annullate</option>
          </select>
        )}

        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tutte le organizzazioni</option>
          {orgSummaries.map(org => (
            <option key={org.organization_id} value={org.organization_id}>
              {org.organization_name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {activeTab === 'memberships' && (
          <div className="memberships-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Codice</th>
                  <th>Cliente</th>
                  <th>Organizzazione</th>
                  <th>Template</th>
                  <th>Utilizzi</th>
                  <th>Scadenza</th>
                  <th>Stato</th>
                  <th>Prezzo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredMemberships.map(membership => (
                  <tr key={membership.id}>
                    <td>
                      <span className="code-badge">{membership.subscription_code}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <User size={16} />
                        <span>{membership.customer?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="org-cell">
                        <Building2 size={16} />
                        <span>{membership.organization?.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td>{membership.template?.name || 'N/A'}</td>
                    <td>
                      <span className="usage-badge">
                        {membership.usage_count} / {membership.template?.total_limit || '∞'}
                      </span>
                    </td>
                    <td>{formatDate(membership.end_date)}</td>
                    <td>{getStatusBadge(membership.status)}</td>
                    <td className="amount">{formatCurrency(membership.price || 0)}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setSelectedMembership(membership);
                          setShowDetailsModal(true);
                        }}
                        title="Visualizza dettagli"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMemberships.length === 0 && (
              <div className="empty-state">
                <Package size={48} />
                <p>Nessuna membership trovata</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-grid">
            {filteredTemplates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-header">
                  <h3>{template.name}</h3>
                  <span className="template-price">{formatCurrency(template.price)}</span>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-meta">
                  <div className="meta-item">
                    <Building2 size={14} />
                    <span>{template.organization?.name}</span>
                  </div>
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{template.duration_value} {template.duration_type}</span>
                  </div>
                  {template.daily_limit && (
                    <div className="meta-item">
                      <TrendingUp size={14} />
                      <span>{template.daily_limit}/giorno</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="empty-state">
                <Package size={48} />
                <p>Nessun template trovato</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="org-stats-grid">
            {orgSummaries.map(org => (
              <div key={org.organization_id} className="org-stat-card">
                <div className="org-header">
                  <Building2 size={20} />
                  <h3>{org.organization_name}</h3>
                </div>
                <div className="org-metrics">
                  <div className="metric">
                    <span className="metric-label">Membership Attive</span>
                    <span className="metric-value">{org.total_active}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Ricavi Totali</span>
                    <span className="metric-value">{formatCurrency(org.total_revenue)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Template Creati</span>
                    <span className="metric-value">{org.template_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedMembership && (
        <>
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)} />
          <div className="details-modal">
            <div className="modal-header">
              <h2>Dettagli Membership</h2>
              <button onClick={() => setShowDetailsModal(false)} className="btn-close">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Codice</span>
                  <span className="value code">{selectedMembership.subscription_code}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Stato</span>
                  {getStatusBadge(selectedMembership.status)}
                </div>
                <div className="detail-item">
                  <span className="label">Cliente</span>
                  <span className="value">{selectedMembership.customer?.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email</span>
                  <span className="value">{selectedMembership.customer?.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Organizzazione</span>
                  <span className="value">{selectedMembership.organization?.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Template</span>
                  <span className="value">{selectedMembership.template?.name || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Prezzo Pagato</span>
                  <span className="value amount">{formatCurrency(selectedMembership.price || 0)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Utilizzi</span>
                  <span className="value">
                    {selectedMembership.usage_count} / {selectedMembership.template?.total_limit || '∞'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Data Inizio</span>
                  <span className="value">{formatDate(selectedMembership.start_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Data Scadenza</span>
                  <span className="value">{formatDate(selectedMembership.end_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Creata il</span>
                  <span className="value">{formatDate(selectedMembership.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMembershipsDashboard;
