/**
 * Admin Gift Certificates Dashboard
 *
 * Global view of all gift certificates across all organizations
 * for super admin monitoring and management
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  Euro,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Building2,
  Calendar,
  User,
  Mail,
  Phone,
  QrCode,
  AlertCircle,
  BarChart3,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { GiftCertificate } from '../../types/giftCertificate';
import PageLoader from '../UI/PageLoader';
import './AdminGiftCertificatesDashboard.css';

interface GlobalStats {
  total_issued: number;
  total_issued_amount: number;
  total_active: number;
  total_active_balance: number;
  total_redeemed: number;
  total_redeemed_amount: number;
  organizations_count: number;
  certificates_this_month: number;
}

interface OrganizationSummary {
  organization_id: string;
  organization_name: string;
  total_issued: number;
  total_amount: number;
  active_count: number;
  active_balance: number;
}

const AdminGiftCertificatesDashboard: React.FC = () => {
  const [stats, setStats] = useState<GlobalStats>({
    total_issued: 0,
    total_issued_amount: 0,
    total_active: 0,
    total_active_balance: 0,
    total_redeemed: 0,
    total_redeemed_amount: 0,
    organizations_count: 0,
    certificates_this_month: 0
  });
  const [certificates, setCertificates] = useState<GiftCertificate[]>([]);
  const [orgSummaries, setOrgSummaries] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
  const [selectedOrg, setSelectedOrg] = useState<string>('all');
  const [selectedCert, setSelectedCert] = useState<GiftCertificate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGlobalStats(),
        loadCertificates(),
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
      // Load all certificates
      console.log('📊 Loading global stats...');
      const { data: allCerts, error } = await supabase
        .from('gift_certificates')
        .select('*');

      console.log('📊 Gift certificates loaded:', { count: allCerts?.length, error });

      if (error) throw error;

      if (allCerts) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Log all statuses to see what we have
        const statusCounts = allCerts.reduce((acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📊 Certificate statuses:', statusCounts);

        // Active: only certificates with full balance
        const active = allCerts.filter(c => c.current_balance > 0 && c.current_balance === c.original_amount);

        // Redeemed: certificates that have been used (partially or fully)
        // Status can be 'partially_used' or 'fully_used'
        const redeemed = allCerts.filter(c =>
          c.status === 'partially_used' ||
          c.status === 'fully_used' ||
          c.current_balance < c.original_amount
        );

        const thisMonth = allCerts.filter(c => new Date(c.issued_at) >= monthStart);

        console.log('📊 Filtered counts:', {
          active: active.length,
          redeemed: redeemed.length,
          thisMonth: thisMonth.length,
          totalCerts: allCerts.length
        });

        // Get unique organizations
        const uniqueOrgs = new Set(allCerts.map(c => c.organization_id));

        setStats({
          total_issued: allCerts.length,
          total_issued_amount: allCerts.reduce((sum, c) => sum + c.original_amount, 0),
          total_active: active.length,
          total_active_balance: active.reduce((sum, c) => sum + c.current_balance, 0),
          total_redeemed: redeemed.length,
          total_redeemed_amount: redeemed.reduce((sum, c) => sum + (c.original_amount - c.current_balance), 0),
          organizations_count: uniqueOrgs.size,
          certificates_this_month: thisMonth.length
        });
      }
    } catch (error) {
      console.error('Error loading global stats:', error);
    }
  };

  const loadCertificates = async () => {
    try {
      console.log('📋 Loading certificates list...');
      const { data, error } = await supabase
        .from('gift_certificates')
        .select(`
          *,
          organization:organizations(id, name)
        `)
        .order('issued_at', { ascending: false })
        .limit(100);

      console.log('📋 Certificates list loaded:', { count: data?.length, error });

      if (error) throw error;

      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
  };

  const loadOrganizationSummaries = async () => {
    try {
      const { data: certs, error } = await supabase
        .from('gift_certificates')
        .select(`
          organization_id,
          status,
          original_amount,
          current_balance,
          organization:organizations(name)
        `);

      if (error) throw error;

      if (certs) {
        // Group by organization
        const summaryMap = new Map<string, OrganizationSummary>();

        certs.forEach((cert: any) => {
          const orgId = cert.organization_id;
          const orgName = cert.organization?.name || 'Unknown';

          if (!summaryMap.has(orgId)) {
            summaryMap.set(orgId, {
              organization_id: orgId,
              organization_name: orgName,
              total_issued: 0,
              total_amount: 0,
              active_count: 0,
              active_balance: 0
            });
          }

          const summary = summaryMap.get(orgId)!;
          summary.total_issued++;
          summary.total_amount += cert.original_amount;

          if (cert.status === 'active') {
            summary.active_count++;
            summary.active_balance += cert.current_balance;
          }
        });

        const summaries = Array.from(summaryMap.values())
          .sort((a, b) => b.total_amount - a.total_amount);

        setOrgSummaries(summaries);
      }
    } catch (error) {
      console.error('Error loading organization summaries:', error);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch =
      cert.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert as any).organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cert.current_balance > 0 && cert.current_balance === cert.original_amount) ||
      (statusFilter === 'used' && (cert.status === 'partially_used' || cert.status === 'fully_used' || cert.current_balance < cert.original_amount)) ||
      (statusFilter === 'expired' && cert.status === 'expired');

    const matchesOrg =
      selectedOrg === 'all' ||
      cert.organization_id === selectedOrg;

    return matchesSearch && matchesStatus && matchesOrg;
  });

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
    const badges = {
      active: { label: 'Attivo', class: 'active', icon: CheckCircle },
      redeemed: { label: 'Riscattato', class: 'redeemed', icon: CheckCircle },
      expired: { label: 'Scaduto', class: 'expired', icon: AlertCircle },
      cancelled: { label: 'Annullato', class: 'cancelled', icon: AlertCircle }
    };

    const badge = badges[status as keyof typeof badges] || badges.active;
    const Icon = badge.icon;

    return (
      <span className={`admin-gc-status-badge ${badge.class}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="admin-gc-dashboard">
      {/* Header */}
      <div className="admin-gc-header">
        <div className="header-content">
          <CreditCard size={32} />
          <div>
            <h1>Gift Certificates - Vista Globale</h1>
            <p>Monitoraggio e gestione gift certificates di tutte le organizzazioni</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Global Stats */}
      <div className="admin-gc-stats-grid">
        <div className="admin-gc-stat-card">
          <div className="stat-icon issued">
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_issued}</div>
            <div className="stat-label">Certificati Emessi</div>
            <div className="stat-amount">{formatCurrency(stats.total_issued_amount)}</div>
          </div>
        </div>

        <div className="admin-gc-stat-card">
          <div className="stat-icon active">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_active}</div>
            <div className="stat-label">Certificati Attivi</div>
            <div className="stat-amount">{formatCurrency(stats.total_active_balance)}</div>
          </div>
        </div>

        <div className="admin-gc-stat-card">
          <div className="stat-icon redeemed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_redeemed}</div>
            <div className="stat-label">Riscattati</div>
            <div className="stat-amount">{formatCurrency(stats.total_redeemed_amount)}</div>
          </div>
        </div>

        <div className="admin-gc-stat-card">
          <div className="stat-icon organizations">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.organizations_count}</div>
            <div className="stat-label">Organizzazioni</div>
            <div className="stat-sublabel">{stats.certificates_this_month} questo mese</div>
          </div>
        </div>
      </div>

      {/* Organization Summaries */}
      <div className="admin-gc-section">
        <div className="section-header">
          <h2>
            <BarChart3 size={20} />
            Riepilogo per Organizzazione
          </h2>
        </div>
        <div className="org-summaries-grid">
          {orgSummaries.map(org => (
            <div key={org.organization_id} className="org-summary-card">
              <div className="org-name">
                <Building2 size={16} />
                {org.organization_name}
              </div>
              <div className="org-stats">
                <div className="org-stat">
                  <span className="org-stat-label">Emessi:</span>
                  <span className="org-stat-value">{org.total_issued}</span>
                </div>
                <div className="org-stat">
                  <span className="org-stat-label">Totale:</span>
                  <span className="org-stat-value">{formatCurrency(org.total_amount)}</span>
                </div>
                <div className="org-stat">
                  <span className="org-stat-label">Attivi:</span>
                  <span className="org-stat-value">{org.active_count}</span>
                </div>
                <div className="org-stat">
                  <span className="org-stat-label">Saldo:</span>
                  <span className="org-stat-value">{formatCurrency(org.active_balance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="admin-gc-filters">
        <div className="filter-group">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per codice, nome, email, organizzazione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Attivi</option>
            <option value="redeemed">Riscattati</option>
            <option value="expired">Scaduti</option>
          </select>
        </div>

        <div className="filter-group">
          <Building2 size={18} />
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
      </div>

      {/* Certificates Table */}
      <div className="admin-gc-table-container">
        <table className="admin-gc-table">
          <thead>
            <tr>
              <th>Codice</th>
              <th>Organizzazione</th>
              <th>Beneficiario</th>
              <th>Importo Originale</th>
              <th>Saldo Attuale</th>
              <th>Riscattato</th>
              <th>Stato</th>
              <th>Emesso</th>
              <th>Scadenza</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredCertificates.length === 0 ? (
              <tr>
                <td colSpan={10} className="no-data">
                  <AlertCircle size={48} />
                  <p>Nessun gift certificate trovato</p>
                </td>
              </tr>
            ) : (
              filteredCertificates.map(cert => (
                <tr key={cert.id}>
                  <td>
                    <div className="cert-code">
                      <QrCode size={16} />
                      <code>{cert.code}</code>
                    </div>
                  </td>
                  <td>
                    <div className="org-cell">
                      <Building2 size={14} />
                      {(cert as any).organization?.name || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="recipient-cell">
                      <div>
                        <User size={14} />
                        {cert.recipient_name || 'N/A'}
                      </div>
                      {cert.recipient_email && (
                        <div className="recipient-email">
                          <Mail size={12} />
                          {cert.recipient_email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="amount-cell">{formatCurrency(cert.original_amount)}</td>
                  <td className="amount-cell balance">{formatCurrency(cert.current_balance)}</td>
                  <td className="amount-cell redeemed">
                    {formatCurrency(cert.original_amount - cert.current_balance)}
                  </td>
                  <td>{getStatusBadge(cert.status)}</td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {formatDate(cert.issued_at)}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Clock size={14} />
                      {formatDate(cert.valid_until)}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn"
                        title="Visualizza dettagli"
                        onClick={() => {
                          console.log('👁️ Eye button clicked for certificate:', cert.code);
                          setSelectedCert(cert);
                          setShowDetailsModal(true);
                          console.log('👁️ Modal state updated:', { showDetailsModal: true });
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {(() => {
        if (showDetailsModal && selectedCert) {
          console.log('🎭 Rendering modal for certificate:', selectedCert.code);
        } else {
          console.log('🎭 Modal NOT rendering:', { showDetailsModal, hasSelectedCert: !!selectedCert });
        }
      })()}
      {showDetailsModal && selectedCert && (
        <>
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)} />
          <div className="admin-gc-details-modal">
            <div className="modal-header">
              <div className="modal-header-content">
                <CreditCard size={24} />
                <h2>Dettagli Gift Certificate</h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>
                    <QrCode size={18} />
                    Codice
                  </label>
                  <div className="detail-value code">{selectedCert.code}</div>
                </div>

                <div className="detail-item">
                  <label>
                    <Building2 size={18} />
                    Organizzazione
                  </label>
                  <div className="detail-value">
                    {(selectedCert as any).organization?.name || 'N/A'}
                  </div>
                </div>

                <div className="detail-item">
                  <label>
                    <User size={18} />
                    Beneficiario
                  </label>
                  <div className="detail-value">
                    {selectedCert.recipient_name || 'N/A'}
                  </div>
                </div>

                {selectedCert.recipient_email && (
                  <div className="detail-item">
                    <label>
                      <Mail size={18} />
                      Email
                    </label>
                    <div className="detail-value">{selectedCert.recipient_email}</div>
                  </div>
                )}

                {selectedCert.recipient_phone && (
                  <div className="detail-item">
                    <label>
                      <Phone size={18} />
                      Telefono
                    </label>
                    <div className="detail-value">{selectedCert.recipient_phone}</div>
                  </div>
                )}

                <div className="detail-item highlight">
                  <label>
                    <DollarSign size={18} />
                    Importo Originale
                  </label>
                  <div className="detail-value amount">
                    {formatCurrency(selectedCert.original_amount)}
                  </div>
                </div>

                <div className="detail-item highlight">
                  <label>
                    <TrendingUp size={18} />
                    Saldo Disponibile
                  </label>
                  <div className="detail-value amount">
                    {formatCurrency(selectedCert.current_balance)}
                  </div>
                </div>

                <div className="detail-item highlight">
                  <label>
                    <CheckCircle size={18} />
                    Importo Riscattato
                  </label>
                  <div className="detail-value amount redeemed">
                    {formatCurrency(selectedCert.original_amount - selectedCert.current_balance)}
                  </div>
                </div>

                <div className="detail-item">
                  <label>Stato</label>
                  <div className="detail-value">{getStatusBadge(selectedCert.status)}</div>
                </div>

                <div className="detail-item">
                  <label>
                    <Calendar size={18} />
                    Data Emissione
                  </label>
                  <div className="detail-value">{formatDate(selectedCert.issued_at)}</div>
                </div>

                <div className="detail-item">
                  <label>
                    <Clock size={18} />
                    Valido Fino Al
                  </label>
                  <div className="detail-value">{formatDate(selectedCert.valid_until)}</div>
                </div>

                {selectedCert.personal_message && (
                  <div className="detail-item full-width">
                    <label>Messaggio Personale</label>
                    <div className="detail-value message">
                      {selectedCert.personal_message}
                    </div>
                  </div>
                )}

                {/* Usage Progress Bar */}
                {selectedCert.original_amount > 0 && (
                  <div className="detail-item full-width">
                    <label>Progresso Utilizzo</label>
                    <div className="usage-progress">
                      <div className="progress-info">
                        <span>
                          {Math.round((1 - selectedCert.current_balance / selectedCert.original_amount) * 100)}% utilizzato
                        </span>
                        <span>
                          {formatCurrency(selectedCert.original_amount - selectedCert.current_balance)} / {formatCurrency(selectedCert.original_amount)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${((selectedCert.original_amount - selectedCert.current_balance) / selectedCert.original_amount) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Chiudi
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminGiftCertificatesDashboard;
