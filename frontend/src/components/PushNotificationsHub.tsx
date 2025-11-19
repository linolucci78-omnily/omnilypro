import React, { useState } from 'react'
import { Bell, Send, Eye, Save, Sparkles, Users, BarChart3, Settings, FileText, ArrowLeft } from 'lucide-react'
import NotificationEditor from './NotificationEditor'
import './PushNotificationsHub.css'

interface PushNotificationsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

type TabType = 'editor' | 'templates' | 'analytics' | 'settings'

const PushNotificationsHub: React.FC<PushNotificationsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('editor')

  return (
    <div
      className="push-notifications-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header con Tabs */}
      <div className="push-hub-header">
        <div className="push-hub-title">
          <Bell className="push-hub-icon" size={32} />
          <div>
            <h1>Push Notifications</h1>
            <p>Gestisci notifiche push con animazioni per i tuoi clienti</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="push-hub-tabs">
          <button
            className={`push-hub-tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Send size={20} />
            <span>Editor</span>
          </button>
          <button
            className={`push-hub-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={20} />
            <span>Templates</span>
          </button>
          <button
            className={`push-hub-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>
          <button
            className={`push-hub-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Impostazioni</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="push-hub-content">
        {activeTab === 'editor' && (
          <NotificationEditor
            organizationId={organizationId}
            onSave={(template) => {
              console.log('Template saved:', template)
              alert('Template salvato!')
            }}
            onSend={(campaign) => {
              console.log('Campaign sent:', campaign)
              alert('Campagna pronta per invio!')
            }}
          />
        )}

        {activeTab === 'templates' && (
          <div className="push-hub-empty">
            <FileText size={64} />
            <h3>Templates Salvati</h3>
            <p>Gestisci i tuoi template predefiniti per notifiche ricorrenti</p>
            <span className="push-hub-coming-soon">Coming Soon</span>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="push-hub-empty">
            <BarChart3 size={64} />
            <h3>Analytics & Report</h3>
            <p>Monitora performance delle notifiche: consegnate, aperte, click e conversioni</p>
            <span className="push-hub-coming-soon">Coming Soon</span>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="push-hub-empty">
            <Settings size={64} />
            <h3>Impostazioni OneSignal</h3>
            <p>Configura App ID, REST API Key e impostazioni avanzate</p>
            <span className="push-hub-coming-soon">Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default PushNotificationsHub
