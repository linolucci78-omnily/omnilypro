/**
* Subscriptions Management Panel
*
* Main panel for managing subscriptions (organization/POS side)
* Similar structure to GiftCertificatesPanel
*/

import React, { useState, useEffect } from 'react';
import {
X,
Package,
Users,
TrendingUp,
Plus,
Search,
CreditCard,
QrCode,
Settings as SettingsIcon,
Calendar,
Euro
} from 'lucide-react';
import { subscriptionsService } from '../services/subscriptionsService';
import type {
SubscriptionTemplate,
CustomerSubscription,
SubscriptionStats
} from '../types/subscription';
import SellSubscriptionModal from './SellSubscriptionModal';
import ValidateSubscriptionModal from './ValidateSubscriptionModal';
import CreateTemplateModal from './CreateTemplateModal';
import './SubscriptionsPanel.css';

interface SubscriptionsPanelProps {
isOpen: boolean;
onClose: () => void;
organizationId: string;
organizationName: string;
printService?: any;
availableCategories?: string[];
initialModal?: 'manage' | 'templates' | 'stats';
}

const SubscriptionsPanel: React.FC<SubscriptionsPanelProps> = ({
isOpen,
onClose,
organizationId,
organizationName,
printService,
availableCategories = [],
initialModal
}) => {
// Use organizationId from props, fallback to localStorage if empty
const effectiveOrgId = organizationId || localStorage.getItem('selectedOrganizationId') || '';

const [loading, setLoading] = useState(false);

// Templates
const [templates, setTemplates] = useState<SubscriptionTemplate[]>([]);

// Subscriptions
const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);

// Stats
const [stats, setStats] = useState<SubscriptionStats>({
total_active: 0,
total_paused: 0,
total_expired: 0,
total_cancelled: 0,
total_revenue: 0,
monthly_revenue: 0,
total_usages: 0,
monthly_usages: 0,
expiring_soon: 0,
avg_subscription_value: 0,
renewal_rate: 0
});

// Modal states
const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
const [showSellSubscriptionModal, setShowSellSubscriptionModal] = useState(false);
const [showValidateModal, setShowValidateModal] = useState(false);

useEffect(() => {
if (isOpen && effectiveOrgId) {
loadAllData();
}
}, [isOpen, effectiveOrgId]);

useEffect(() => {
if (isOpen && initialModal) {
// Open the appropriate modal based on initialModal prop
if (initialModal === 'templates') {
setShowCreateTemplateModal(true);
}
// 'stats' modal will be handled separately in OrganizationsDashboard
// 'manage' doesn't need a modal, just shows the panel content
}
}, [isOpen, initialModal]);

const loadAllData = async () => {
setLoading(true);
try {
await Promise.all([
loadTemplates(),
loadSubscriptions(),
loadStats()
]);
} catch (error) {
console.error('Error loading data:', error);
} finally {
setLoading(false);
}
};

const loadTemplates = async () => {
try {
const response = await subscriptionsService.getTemplates({
organization_id: effectiveOrgId,
is_active: true
});
setTemplates(response.data);
} catch (error) {
console.error('Error loading templates:', error);
}
};

const loadSubscriptions = async () => {
try {
const response = await subscriptionsService.getSubscriptions({
organization_id: effectiveOrgId,
status: ['active', 'paused']
});
setSubscriptions(response.data);
} catch (error) {
console.error('Error loading subscriptions:', error);
}
};

const loadStats = async () => {
try {
const data = await subscriptionsService.getStats(effectiveOrgId);
setStats(data);
} catch (error) {
console.error('Error loading stats:', error);
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
const badges: Record<string, { label: string; color: string }> = {
active: { label: 'Attivo', color: '#10b981' },
paused: { label: 'In Pausa', color: '#f59e0b' },
expired: { label: 'Scaduto', color: '#6b7280' },
cancelled: { label: 'Annullato', color: '#ef4444' }
};

const badge = badges[status] || badges.active;

return (
<span style={{
padding: '0.375rem 0.75rem',
borderRadius: '12px',
fontSize: '0.75rem',
fontWeight: 600,
backgroundColor: `${badge.color}20`,
color: badge.color
}}>
{badge.label}
</span>
);
};

if (!isOpen) return null;

return (
<>
<div className="subscriptions-panel-overlay" onClick={onClose} />

<div className={`subscriptions-panel ${isOpen ? 'open' : ''}`}>
{/* Header */}
<div className="subscriptions-panel-header">
<div className="subscriptions-header-info">
<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
<Package size={28} />
<div>
<h2>Membership</h2>
<p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
{organizationName}
</p>
</div>
</div>
</div>
<button onClick={onClose} className="subscriptions-panel-close-btn">
<X size={24} />
</button>
</div>

{/* Quick Stats */}
<div className="subscriptions-quick-stats">
<div className="subscriptions-stat-item">
<div className="subscriptions-stat-icon">
<Users size={24} />
</div>
<div className="subscriptions-stat-number">{stats.total_active}</div>
<div className="subscriptions-stat-label">Attivi</div>
</div>
<div className="subscriptions-stat-item">
<div className="subscriptions-stat-icon">
<Euro size={24} />
</div>
<div className="subscriptions-stat-number" style={{ fontSize: '1.25rem' }}>
{formatCurrency(stats.total_revenue)}
</div>
<div className="subscriptions-stat-label">Incassato</div>
</div>
<div className="subscriptions-stat-item">
<div className="subscriptions-stat-icon">
<TrendingUp size={24} />
</div>
<div className="subscriptions-stat-number">{stats.total_usages}</div>
<div className="subscriptions-stat-label">Utilizzi</div>
</div>
</div>

{/* Action Buttons */}
<div className="subscriptions-panel-actions">
<button
className="subscriptions-action-btn subscriptions-action-btn-primary"
onClick={() => setShowSellSubscriptionModal(true)}
>
<Plus size={20} />
Vendi Membership
</button>

<button
className="subscriptions-action-btn subscriptions-action-btn-secondary"
onClick={() => setShowValidateModal(true)}
>
<QrCode size={20} />
Valida Utilizzo
</button>
</div>

{/* Subscriptions List */}
<div className="subscriptions-content">
<h3 style={{ margin: '0 0 1rem 0', padding: '0 2rem', fontSize: '1.25rem', fontWeight: 700, color: '#1f2937' }}>
Membership Attive
</h3>
{loading ? (
<div className="loading-state">
<Calendar size={32} className="spinning" />
<p>Caricamento...</p>
</div>
) : subscriptions.length === 0 ? (
<div className="empty-state">
<Package size={48} style={{ opacity: 0.3 }} />
<p>Nessuna membership attiva</p>
</div>
) : (
<div className="subscriptions-list" style={{ padding: '0 2rem' }}>
{subscriptions.map(sub => (
<div key={sub.id} className="subscription-card">
<div className="sub-card-header">
<div>
<div className="sub-code">{sub.subscription_code}</div>
<div className="sub-customer">
{sub.customer?.name || 'Cliente sconosciuto'}
</div>
</div>
{getStatusBadge(sub.status)}
</div>
<div className="sub-card-body">
<div className="sub-info-row">
<span>Template:</span>
<span>{sub.template?.name || 'N/A'}</span>
</div>
<div className="sub-info-row">
<span>Utilizzi:</span>
<span>{sub.usage_count} / {sub.template?.total_limit || '∞'}</span>
</div>
<div className="sub-info-row">
<span>Scadenza:</span>
<span>{formatDate(sub.end_date)}</span>
</div>
</div>
</div>
))}
</div>
)}
</div>
</div>

{/* Modals */}
<SellSubscriptionModal
isOpen={showSellSubscriptionModal}
onClose={() => setShowSellSubscriptionModal(false)}
organizationId={effectiveOrgId}
organizationName={organizationName}
templates={templates}
onSuccess={(subscription) => {
setShowSellSubscriptionModal(false);
loadSubscriptions();
loadStats();
}}
printService={printService}
/>

<ValidateSubscriptionModal
isOpen={showValidateModal}
onClose={() => setShowValidateModal(false)}
organizationId={effectiveOrgId}
        organizationName={organizationName}
onSuccess={() => {
setShowValidateModal(false);
loadSubscriptions();
loadStats();
}}
printService={printService}
/>

<CreateTemplateModal
isOpen={showCreateTemplateModal}
onClose={() => setShowCreateTemplateModal(false)}
organizationId={effectiveOrgId}
onSuccess={() => {
setShowCreateTemplateModal(false);
loadTemplates();
}}
availableCategories={availableCategories}
/>
</>
);
};

export default SubscriptionsPanel;