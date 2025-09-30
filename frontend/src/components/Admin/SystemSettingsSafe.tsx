import React from 'react'
import { Settings, Monitor, Database, Cpu, MemoryStick, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react'

const SystemSettingsSafe: React.FC = () => {
  return (
    <div style={{ padding: '0', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '24px',
        background: 'white',
        borderRadius: '0',
        border: 'none',
        borderBottom: '1px solid #e2e8f0',
        width: '100%'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#1e293b' }}>
            Impostazioni di Sistema
          </h1>
          <p style={{ margin: '0', color: '#64748b', fontSize: '16px' }}>
            Configurazione e monitoraggio del sistema OMNILY PRO
          </p>
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          <RefreshCw size={16} />
          Aggiorna
        </button>
      </div>

      {/* System Status */}
      <div style={{
        background: 'white',
        borderRadius: '0',
        padding: '24px',
        marginBottom: '24px',
        border: 'none',
        borderBottom: '1px solid #e2e8f0',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#dcfce7',
              color: '#16a34a',
              fontWeight: '600'
            }}>
              <CheckCircle2 size={20} />
              Sistema Operativo
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '14px'
            }}>
              Uptime: 25d 14h
            </div>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '14px'
            }}>
              147 utenti attivi
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#64748b',
              fontSize: '14px'
            }}>
              120ms response time
            </div>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        marginBottom: '32px',
        padding: '0 24px',
        width: '100%'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Cpu size={20} />
            CPU
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            35.2%
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '35.2%',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: '3px'
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <MemoryStick size={20} />
            Memoria
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            68.7%
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '68.7%',
              background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
              borderRadius: '3px'
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <HardDrive size={20} />
            Disco
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            42.1%
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#f1f5f9',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '42.1%',
              background: 'linear-gradient(90deg, #f59e0b, #d97706)',
              borderRadius: '3px'
            }} />
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <Database size={20} />
            DB Connections
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '4px'
          }}>
            45
          </div>
          <div style={{
            fontSize: '12px',
            color: '#64748b'
          }}>
            connessioni attive
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div style={{
        background: 'white',
        borderRadius: '0',
        padding: '40px 24px',
        border: 'none',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
        width: '100%',
        margin: '0'
      }}>
        <Settings size={64} style={{ color: '#64748b', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>
          System Settings
        </h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Sistema di monitoraggio e configurazione avanzato
        </p>
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '16px',
          color: '#166534'
        }}>
          ✅ Monitoraggio risorse real-time<br />
          ✅ Configurazioni sistema modificabili<br />
          ✅ Backup e manutenzione database<br />
          ✅ Gestione integrazioni complete
        </div>
      </div>
    </div>
  )
}

export default SystemSettingsSafe