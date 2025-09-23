import React, { useState, useEffect } from 'react'
import { supabase, organizationsApi, customersApi } from '../lib/supabase'
import type { Organization, Customer } from '../lib/supabase'
import { BarChart3, Users, Gift, Target, TrendingUp, Settings, HelpCircle, LogOut, Search, QrCode, CreditCard, UserCheck, AlertTriangle, X } from 'lucide-react'
import RegistrationWizard from './RegistrationWizard'
import CustomerSlidePanel from './CustomerSlidePanel'
import CardManagementPanel from './CardManagementPanel'
import './OrganizationsDashboard.css'

interface OrganizationsDashboardProps {
  onSectionChange?: (section: string) => void;
  activeSection?: string;
}

const OrganizationsDashboard: React.FC<OrganizationsDashboardProps> = ({
  onSectionChange,
  activeSection: externalActiveSection
}) => {
  // Detect POS mode
  const isPOSMode = typeof window !== 'undefined' &&
    window.location.search.includes('posomnily=true')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerStats, setCustomerStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    withNotifications: 0
  })
  const [loading, setLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState(externalActiveSection || 'dashboard')

  // Sync with external activeSection changes (from POS menu)
  useEffect(() => {
    if (externalActiveSection) {
      setActiveSection(externalActiveSection)
    }
  }, [externalActiveSection])

  // Handle section change and notify parent (POS layout)
  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (onSectionChange) {
      onSectionChange(section)
    }
  }
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  
  const [nfcStatus, setNfcStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle');
  const [nfcResult, setNfcResult] = useState<any>(null);

  // NFC Card Reading function - SOLO PER DASHBOARD (non CardManagementPanel)
  // Define the global callback function WITHOUT auto-registration
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      // Definiamo il callback ma NON lo registriamo automaticamente
      (window as any).omnilyNFCResultHandler = (result: any) => {
        console.log('📱 Risultato lettura NFC (da dashboard):', result);
        setNfcResult(result);
        setNfcStatus('idle'); // Reset status after reading

        if (result && result.success) {
          console.log('✅ Carta NFC letta:', result.cardNo);
          setNfcStatus('success');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("1", "150");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast('✅ Tessera letta: ' + result.cardNo?.slice(0, 8) + '...');
          }
        } else {
          console.log('❌ Errore lettura NFC:', result?.error || 'Lettura fallita');
          setNfcStatus('error');
          if ((window as any).OmnilyPOS.beep) {
            (window as any).OmnilyPOS.beep("3", "50");
          }
          if ((window as any).OmnilyPOS.showToast) {
            (window as any).OmnilyPOS.showToast('❌ Errore lettura tessera');
          }
        }
      };
      console.log("✅ NFC callback SOLO definito - NON registrato automaticamente");
    }

    // CLEANUP quando il componente si smonta
    return () => {
      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;

        // Disregistra SEMPRE tutti i callback NFC
        if (bridge.unregisterNFCResultCallback) {
          bridge.unregisterNFCResultCallback('omnilyNFCResultHandler');
          console.log("🧹 CLEANUP: NFC callback DISREGISTRATO per dashboard");
        }

        // Ferma qualsiasi lettura in corso
        if (bridge.stopNFCReading) {
          bridge.stopNFCReading();
          console.log("🧹 CLEANUP: Tutte le letture NFC fermate");
        }

        // Rimuovi tutte le funzioni globali NFC
        delete (window as any).omnilyNFCResultHandler;
        delete (window as any).cardManagementNFCHandler;
        console.log("🧹 CLEANUP: Tutte le funzioni NFC rimosse");
      }
    };
  }, []);

  // NFC Card Reading function
  const handleNFCRead = () => {
    if (nfcStatus === 'reading') {
      // Cancel reading
      setNfcStatus('idle');
      setNfcResult(null);

      if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
        const bridge = (window as any).OmnilyPOS;

        // Disregistra il callback per fermare il bridge
        if (bridge.unregisterNFCResultCallback) {
          bridge.unregisterNFCResultCallback('omnilyNFCResultHandler');
          console.log("❌ NFC callback DISREGISTRATO per dashboard");
        }

        // Ferma il lettore se possibile
        if (bridge.stopNFCReading) {
          bridge.stopNFCReading();
          console.log("🛑 Lettura NFC fermata");
        }

        if (bridge.showToast) {
          bridge.showToast('Lettura NFC annullata');
        }
      }
      return;
    }

    setNfcStatus('reading');
    setNfcResult(null);
    console.log('🔍 Avvio lettura carta NFC...', new Date().toLocaleTimeString());

    if (typeof window !== 'undefined' && (window as any).OmnilyPOS) {
      const bridge = (window as any).OmnilyPOS;

      try {
        // REGISTRA il callback SOLO quando richiesto
        if (bridge.registerNFCResultCallback) {
          bridge.registerNFCResultCallback('omnilyNFCResultHandler');
          console.log("✅ NFC callback registrato per dashboard");
        }

        if (bridge.showToast) {
          bridge.showToast('Avvicina la tessera NFC - Premi di nuovo per annullare');
        }

        if (bridge.readNFCCardAsync) {
          bridge.readNFCCardAsync();
        } else {
          throw new Error('Metodo NFC non disponibile');
        }
        console.log('✅ Chiamata NFC inviata. In attesa del risultato...');

      } catch (error) {
        console.log('💥 Errore chiamata NFC:', error);
        setNfcStatus('error');
        if (error instanceof Error) {
          setNfcResult({ error: error.message });
        } else {
          setNfcResult({ error: 'Unknown error' });
        }
        if (bridge.showToast) {
          bridge.showToast('💥 Errore sistema NFC');
        }
      }

    } else {
      console.log('❌ Bridge non disponibile');
      setNfcStatus('error');
      setNfcResult({ error: 'Bridge non disponibile' });
    }
  };
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isSlidePanelOpen, setIsSlidePanelOpen] = useState(false)

  // Card Management Panel states
  const [showCardManagementPanel, setShowCardManagementPanel] = useState(false)

  // Funzioni per gestire il slide panel
  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsSlidePanelOpen(true)
  }

  const handleCloseSlidePanel = () => {
    setIsSlidePanelOpen(false)
    setSelectedCustomer(null)
  }

  const handleAddPoints = (customerId: string, points: number) => {
    console.log(`Aggiungi ${points} punti al cliente ${customerId}`)
    // Implementare logica aggiunta punti
  }

  const handleNewTransaction = (customerId: string) => {
    console.log(`Nuova transazione per cliente ${customerId}`)
    // Implementare logica nuova transazione
  }

  // Mock data for demo - replace with real data
  const metrics = {
    totalStamps: 17568,
    totalOffers: 1790, 
    totalJoins: 845,
    totalCustomers: 862
  }

  const chartData = [
    { month: 'Gen', stamps: 1200, redemptions: 800 },
    { month: 'Feb', stamps: 1350, redemptions: 950 },
    { month: 'Mar', stamps: 1400, redemptions: 1000 },
    { month: 'Apr', stamps: 1250, redemptions: 850 },
    { month: 'Mag', stamps: 1500, redemptions: 1100 },
    { month: 'Giu', stamps: 1380, redemptions: 980 },
    { month: 'Lug', stamps: 1420, redemptions: 1020 },
    { month: 'Ago', stamps: 1480, redemptions: 1080 },
    { month: 'Set', stamps: 1520, redemptions: 1120 },
    { month: 'Ott', stamps: 1600, redemptions: 1200 },
    { month: 'Nov', stamps: 1450, redemptions: 1050 },
    { month: 'Dic', stamps: 1300, redemptions: 900 }
  ]

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (activeSection === 'members') {
      fetchCustomers()
    }
  }, [activeSection])

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = customers.filter(customer => {
      return (
        customer.name.toLowerCase().includes(lowercasedFilter) ||
        (customer.email && customer.email.toLowerCase().includes(lowercasedFilter)) ||
        (customer.phone && customer.phone.includes(lowercasedFilter)) ||
        customer.id.slice(0, 8).toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true)

      // Carica organizzazioni reali dal database
      const realOrganizations = await organizationsApi.getAll()

      setOrganizations(realOrganizations)
      setError(null)

      console.log(`✅ Caricate ${realOrganizations.length} organizzazioni reali dal database`)
    } catch (err) {
      console.error('❌ Errore nel caricamento organizzazioni:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento organizzazioni')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true)

      // Usa l'organization ID dalla prima organization (in un app reale, dovresti gestire l'organization attiva)
      const organizationId = organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

      // Carica clienti reali dal database
      const realCustomers = await customersApi.getAll(organizationId)
      const realStats = await customersApi.getStats(organizationId)

      setCustomers(realCustomers)
      setCustomerStats(realStats)

      console.log(`✅ Caricati ${realCustomers.length} clienti reali per organization ${organizationId}`)
    } catch (err) {
      console.error('❌ Errore nel caricamento clienti dal database:', err)

      // In caso di errore, mostra un messaggio più utile
      if (err instanceof Error) {
        setError(`Errore caricamento clienti: ${err.message}`)
      } else {
        setError('Errore sconosciuto nel caricamento clienti')
      }

      // Fallback con dati vuoti invece che mock
      setCustomers([])
      setCustomerStats({ total: 0, male: 0, female: 0, withNotifications: 0 })
    } finally {
      setCustomersLoading(false)
    }
  }

  const handleQRScan = () => {
    alert('Simulazione: Scansione QR code avviata...');
  };

  const sidebarItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'stamps', icon: Target, label: 'Tessere Punti' },
    { id: 'members', icon: Users, label: 'Clienti' },
    { id: 'communications', icon: Gift, label: 'Comunicazioni' },
    { id: 'campaigns', icon: TrendingUp, label: 'Campagne' },
    { id: 'settings', icon: Settings, label: 'Impostazioni' },
    { id: 'support', icon: HelpCircle, label: 'Aiuto & Supporto' }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'stamps':
        return (
          <div className="section-content">
            <h2>Gestione Tessere Punti</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Configura Tessere</h3>
                <p>Crea e personalizza le tessere punti per i tuoi clienti</p>
                <button className="btn-primary" onClick={() => setShowCardManagementPanel(true)}>
                  <CreditCard size={18} />
                  Gestione Tessere
                </button>
              </div>
              <div className="feature-card">
                <h3>Statistiche Punti</h3>
                <p>Visualizza le performance delle tessere punti</p>
                <button className="btn-primary">Visualizza</button>
              </div>
            </div>
          </div>
        )
      
      case 'members':
        return (
          <div className="dashboard-content full-width">
            {/* Complete Customer List Section */}
            <div className="customer-list-container">
              {/* Header */}
              <div className="customer-list-header">
                <div className="header-left">
                  <div className="header-icon">
                    <Users size={24} />
                  </div>
                  <div className="header-content">
                    <h2>LISTA COMPLETA CLIENTI</h2>
                    <p>Visualizza, cerca e gestisci tutti i clienti registrati.</p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="customer-stats-row">
                <div className="customer-stat-card total">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.total}</div>
                    <div className="stat-label">CLIENTI TOTALI</div>
                  </div>
                </div>
                
                <div className="customer-stat-card male">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.male}</div>
                    <div className="stat-label">MASCHI</div>
                  </div>
                </div>
                
                <div className="customer-stat-card female">
                  <div className="stat-icon">
                    <Users size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.female}</div>
                    <div className="stat-label">FEMMINE</div>
                  </div>
                </div>
                
                <div className="customer-stat-card notifications">
                  <div className="stat-icon">
                    <Target size={20} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-number">{customerStats.withNotifications}</div>
                    <div className="stat-label">CON NOTIFICHE</div>
                  </div>
                </div>
              </div>

              {/* Customer Table Controls */}
              <div className="customer-table-controls">
                <div className="search-bar">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Cerca cliente per nome, email, o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="search-query"
                    name="customer-search"
                    form="customer-search-form"
                    data-form="customer-search"
                  />
                </div>
                <div className="table-actions">
                  <button className="btn-secondary" onClick={handleQRScan}>
                    <QrCode size={16} />
                    <span>Scansiona QR</span>
                  </button>
                  <button 
                    className={`btn-secondary nfc-button ${nfcStatus}`}
                    onClick={handleNFCRead}
                  >
                    <CreditCard size={16} />
                    <span>
                      {nfcStatus === 'reading' && 'Annulla Lettura'}
                      {nfcStatus === 'idle' && 'Leggi Tessera'}
                      {nfcStatus === 'success' && 'Leggi di Nuovo'}
                      {nfcStatus === 'error' && 'Riprova Lettura'}
                    </span>
                  </button>
                  {nfcResult && (
                    <div className="nfc-result">
                      {nfcResult.success ? (
                        `Tessera Letta: ${nfcResult.cardNo}`
                      ) : (
                        `Errore: ${nfcResult.error}`
                      )}
                    </div>
                  )}
                  <button 
                    className="btn-primary"
                    onClick={() => setShowRegistrationWizard(true)}
                  >
                    <Users size={16} />
                    <span>Nuovo Cliente</span>
                  </button>
                </div>
              </div>

              {/* Customer Table */}
              <div className="customer-table-wrapper">
                <table className="customer-table-new">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Contatti</th>
                      <th>Punti</th>
                      <th>Livello</th>
                      <th>Stato</th>
                      <th>Registrato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersLoading ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div className="loading-spinner">🔄 Caricamento clienti...</div>
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div>Nessun cliente trovato per "{searchTerm}"</div>
                        </td>
                      </tr>
                    ) : filteredCustomers.map((customer, _index) => (
                      <tr
                        key={customer.id}
                        onClick={() => handleCustomerClick(customer)}
                        style={{ cursor: 'pointer' }}
                        className="customer-row-clickable"
                      >
                        <td>
                          <div className="customer-cell">
                            <div className={`customer-avatar-new ${customer.gender || 'male'}`}>
                              <Users size={16} />
                            </div>
                            <div className="customer-info-new">
                              <div className="customer-name-new">{customer.name}</div>
                              <div className="customer-id">#{customer.id.slice(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            {customer.email && (
                              <div className="contact-item">
                                <span>📧</span>
                                <span>{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="contact-item">
                                <span>📱</span>
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="points-cell">
                            <Target size={16} color="#ef4444" />
                            <span>{customer.points}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`level-badge ${customer.tier.toLowerCase()}`}>
                            {customer.tier}
                          </span>
                        </td>
                        <td>
                          <span className={customer.is_active ? "status-active" : "status-inactive"}>
                            {customer.is_active ? '✅ ATTIVO' : '❌ INATTIVO'}
                          </span>
                        </td>
                        <td>{new Date(customer.created_at).toLocaleDateString('it-IT')}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn-blue">
                              <Target size={14} />
                            </button>
                            <button className="action-btn-black">
                              <Users size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Professional Registration Wizard */}
            <RegistrationWizard
              isOpen={showRegistrationWizard}
              onClose={() => setShowRegistrationWizard(false)}
              organizationId={organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'}
              onCustomerCreated={fetchCustomers}
            />
          </div>
        )
      
      case 'communications':
        return (
          <div className="section-content">
            <h2>Comunicazioni</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Email Marketing</h3>
                <p>Invia email personalizzate ai tuoi clienti</p>
                <button className="btn-primary">Crea Email</button>
              </div>
              <div className="feature-card">
                <h3>Notifiche Push</h3>
                <p>Gestisci le notifiche push dell'app</p>
                <button className="btn-primary">Configura</button>
              </div>
            </div>
          </div>
        )
      
      case 'campaigns':
        return (
          <div className="section-content">
            <h2>Campagne Marketing</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Campagne Attive</h3>
                <p>Monitora le tue campagne marketing in corso</p>
                <button className="btn-primary">Visualizza</button>
              </div>
              <div className="feature-card">
                <h3>Nuova Campagna</h3>
                <p>Crea una nuova campagna promozionale</p>
                <button className="btn-primary">Crea</button>
              </div>
            </div>
          </div>
        )
      
      case 'settings':
        return (
          <div className="section-content">
            <h2>Impostazioni</h2>
            
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Configurazione Account</h3>
                <p>Gestisci le impostazioni del tuo account e profilo</p>
                <button className="btn-primary">Configura</button>
              </div>
              <div className="feature-card">
                <h3>Fatturazione</h3>
                <p>Visualizza e gestisci i tuoi piani di abbonamento</p>
                <button className="btn-primary">Gestisci</button>
              </div>
              <div className="feature-card">
                <h3>Sicurezza</h3>
                <p>Configura autenticazione e permessi di accesso</p>
                <button className="btn-primary">Sicurezza</button>
              </div>
              <div className="feature-card">
                <h3>API & Integrazioni</h3>
                <p>Gestisci chiavi API e integrazioni esterne</p>
                <button className="btn-primary">API</button>
              </div>
            </div>
          </div>
        )
      
      case 'support':
        return (
          <div className="section-content">
            <h2>Aiuto & Supporto</h2>
            <div className="cards-grid">
              <div className="feature-card">
                <h3>Centro Assistenza</h3>
                <p>Trova risposte alle domande più frequenti</p>
                <button className="btn-primary">Esplora</button>
              </div>
              <div className="feature-card">
                <h3>Contatta il Supporto</h3>
                <p>Richiedi assistenza tecnica personalizzata</p>
                <button className="btn-primary">Contatta</button>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="dashboard-content">
            {/* Organizations Section */}
            {organizations.length > 0 && (
              <div className="organizations-section">
                <h3 className="section-subtitle">Le Tue Organizzazioni</h3>
                <div className="organizations-grid">
                  {organizations.map(org => (
                    <div key={org.id} className="org-card">
                      <div className="org-header">
                        <div className="org-name">{org.name}</div>
                        <div className="org-slug">{org.slug}</div>
                      </div>
                      <div className={`org-plan plan-${org.plan_type}`}>
                        {org.plan_type.toUpperCase()}
                      </div>
                      <div className="org-details">
                        <div className="detail-item">
                          <div className="detail-value">{org.max_customers}</div>
                          <div className="detail-label">Max Clienti</div>
                        </div>
                        <div className="detail-item">
                          <div className="detail-value">{org.max_workflows}</div>
                          <div className="detail-label">Max Workflows</div>
                        </div>
                      </div>
                      <div className="color-preview">
                        <div 
                          className="color-box" 
                          style={{ backgroundColor: org.primary_color }}
                          title={`Primary: ${org.primary_color}`}
                        />
                        <div 
                          className="color-box" 
                          style={{ backgroundColor: org.secondary_color }}
                          title={`Secondary: ${org.secondary_color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-filters">
              <select className="filter-select">
                <option>Tutte le Sedi</option>
              </select>
              <select className="filter-select">
                <option>Tutte le Offerte</option>
              </select>
              <select className="filter-select">
                <option>Sempre</option>
              </select>
            </div>

            <div className="dashboard-grid">
              {/* Left Column - Metrics */}
              <div className="dashboard-left">
                <div className="metrics-section">
                  <h2 className="section-title">Panoramica</h2>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-icon stamps">
                        <Target size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalStamps.toLocaleString()}</div>
                        <div className="metric-label">Punti totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon offers">
                        <Gift size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalOffers.toLocaleString()}</div>
                        <div className="metric-label">Offerte totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon joins">
                        <TrendingUp size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalJoins}</div>
                        <div className="metric-label">Iscrizioni totali</div>
                      </div>
                    </div>
                    
                    <div className="metric-card">
                      <div className="metric-icon customers">
                        <Users size={24} />
                      </div>
                      <div className="metric-content">
                        <div className="metric-value">{metrics.totalCustomers}</div>
                        <div className="metric-label">Clienti totali</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Activity Chart */}
              <div className="dashboard-right">
                <div className="activity-section">
                  <h2 className="section-title">Attività <span className="subtitle">sempre</span></h2>
                  
                  <div className="activity-tabs">
                    <button className="tab-btn active">Punti</button>
                    <button className="tab-btn">Riscatti</button>
                  </div>
                  
                  <div className="chart-container">
                    <div className="chart-y-axis">
                      <div>1800</div>
                      <div>1400</div>
                      <div>1000</div>
                      <div>600</div>
                      <div>200</div>
                      <div>0</div>
                    </div>
                    <div className="chart-bars">
                      {chartData.map((data, _index) => (
                        <div key={data.month} className="chart-bar-group">
                          <div 
                            className="chart-bar stamps-bar"
                            style={{ height: `${(data.stamps / 1800) * 100}%` }}
                            title={`${data.month}: ${data.stamps} punti`}
                          />
                          <div className="chart-month">{data.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  if (loading) return <div className="loading">🔄 Caricamento...</div>
  if (error) return <div className="error">❌ Errore: {error}</div>

  return (
    <div className={`dashboard-layout ${isPOSMode ? 'pos-mode' : ''}`}>
      {/* Sidebar - Hidden in POS mode */}
      {!isPOSMode && (
        <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">O</div>
            <span className="logo-text">OMNILY PRO</span>
          </div>
          <div className="merchant-console">MERCHANT CONSOLE</div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="version">Version 0.1.0 (48)</div>
        </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <header className="main-header">
          <div className="header-title">
            <BarChart3 size={24} />
            <span>OMNILY PRO - Dashboard</span>
          </div>
          <div className="header-actions">
            <button className="btn-logout">
              <LogOut size={18} />
              Esci
            </button>
          </div>
        </header>

        {renderContent()}
      </div>

      {/* Customer Slide Panel */}
      <CustomerSlidePanel
        customer={selectedCustomer}
        isOpen={isSlidePanelOpen}
        onClose={handleCloseSlidePanel}
        onAddPoints={handleAddPoints}
        onNewTransaction={handleNewTransaction}
      />

      {/* Card Management Panel */}
      <CardManagementPanel
        isOpen={showCardManagementPanel}
        onClose={() => setShowCardManagementPanel(false)}
        customers={customers}
        organizationId={organizations.length > 0 ? organizations[0].id : 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'}
        onAssignCard={(cardId, customerId) => {
          console.log(`Tessera ${cardId} assegnata al cliente ${customerId}`);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
        onReassignCard={(cardId, customerId) => {
          console.log(`Tessera ${cardId} riassegnata al cliente ${customerId}`);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
        onCardRead={(cardData) => {
          console.log('Tessera letta:', cardData);
          // Le tessere sono ora gestite direttamente in Supabase
        }}
      />
    </div>
  )
}

export default OrganizationsDashboard// Cache bust Ven 19 Set 2025 23:40:33 CEST
