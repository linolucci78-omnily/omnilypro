import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Send, Crown, Zap, Shield, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';
import { businessOwnerService } from '../services/businessOwnerService';
import './EditOrganizationModal.css'; // Reuse styles

interface InviteBusinessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type PlanType = 'basic' | 'premium' | 'enterprise';

interface BusinessOwner {
    id: string;
    name: string;
    email: string;
}

const InviteBusinessModal: React.FC<InviteBusinessModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [owners, setOwners] = useState<BusinessOwner[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
    const [loading, setLoading] = useState(false);
    const [loadingOwners, setLoadingOwners] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carica la lista dei proprietari quando il modale si apre
    useEffect(() => {
        if (isOpen) {
            loadOwners();
        }
    }, [isOpen]);

    const loadOwners = async () => {
        setLoadingOwners(true);
        try {
            // Usa il servizio esistente per caricare le organizzazioni con i loro owner
            const organizations = await businessOwnerService.getAllWithOwners();

            console.log('📊 Organizzazioni caricate:', organizations.length);
            console.log('📋 Dettagli organizzazioni:', organizations);

            // Estrai i proprietari unici dalle organizzazioni
            const uniqueOwners = new Map<string, BusinessOwner>();

            organizations.forEach((org: any) => {
                console.log('🔍 Org:', org.name, '- Owner email:', org.owner_email, '- Owner name:', org.owner_name);

                // Usa l'email dell'owner come chiave unica
                if (org.owner_email && !uniqueOwners.has(org.owner_email)) {
                    uniqueOwners.set(org.owner_email, {
                        id: org.owner_email, // Usa email come ID perché non abbiamo user_id
                        name: org.owner_name || org.owner_email,
                        email: org.owner_email
                    });
                }
            });

            const ownersList = Array.from(uniqueOwners.values()).sort((a, b) =>
                a.email.localeCompare(b.email)
            );

            console.log('✅ Proprietari unici trovati:', ownersList.length, ownersList);

            setOwners(ownersList);
        } catch (err) {
            console.error('Error loading owners:', err);
            setError('Errore nel caricamento dei proprietari');
        } finally {
            setLoadingOwners(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOwnerId) return;

        const selectedOwner = owners.find(o => o.id === selectedOwnerId);
        if (!selectedOwner) return;

        const email = selectedOwner.email;

        setLoading(true);
        setError(null);

        try {
            // Generate a unique token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Calculate expiration date (7 days from now)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            // Save to database
            const { error: dbError } = await supabase
                .from('organization_invites')
                .insert({
                    email,
                    token,
                    status: 'pending',
                    role: 'owner',
                    plan_type: selectedPlan,
                    expires_at: expiresAt.toISOString()
                });

            if (dbError) throw dbError;

            // Generate link
            const link = `${window.location.origin}/register?invite=${token}`;
            setInviteLink(link);
            setInvitedEmail(email);

            // Send email automatically
            console.log('📧 Sending invitation email to:', email);
            const emailResult = await emailService.sendBusinessInviteEmail(email, selectedPlan, token);

            if (!emailResult.success) {
                console.error('❌ Failed to send invitation email:', emailResult.error);
                throw new Error('Invito creato ma invio email fallito: ' + emailResult.error);
            }

            console.log('✅ Invitation email sent successfully');

        } catch (err: any) {
            console.error('Error creating invite:', err);
            setError(err.message || 'Errore durante la creazione dell\'invito');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReset = () => {
        setSelectedOwnerId('');
        setInviteLink(null);
        setInvitedEmail(null);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="edit-org-overlay" onClick={onClose} />

            <div className="edit-org-modal">
                {/* Header */}
                <div className="edit-org-header">
                    <div className="edit-org-header-content">
                        <Send size={24} />
                        <div>
                            <h2>Invita Azienda</h2>
                            <p>Crea un invito per associare una nuova azienda a un proprietario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="edit-org-close-btn" disabled={loading}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="edit-org-content">
                    {!inviteLink ? (
                        <form onSubmit={handleInvite}>
                            <div className="edit-org-tab-content">
                                <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
                                    Seleziona il proprietario a cui vuoi associare una nuova azienda.
                                    Il sistema invierà automaticamente un'email con il link di registrazione.
                                </p>

                                <div className="form-group">
                                    <label className="form-label">
                                        <User size={16} />
                                        Seleziona Proprietario *
                                    </label>
                                    <select
                                        value={selectedOwnerId}
                                        onChange={(e) => setSelectedOwnerId(e.target.value)}
                                        required
                                        className="form-select"
                                        disabled={loadingOwners}
                                    >
                                        <option value="">
                                            {loadingOwners ? 'Caricamento...' : 'Seleziona un proprietario'}
                                        </option>
                                        {owners.map(owner => (
                                            <option key={owner.id} value={owner.id}>
                                                {owner.name} ({owner.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Seleziona Piano *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                    {/* Basic Plan */}
                                    <div
                                        onClick={() => setSelectedPlan('basic')}
                                        style={{
                                            border: selectedPlan === 'basic' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: selectedPlan === 'basic' ? '#eff6ff' : 'white'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Shield size={20} color={selectedPlan === 'basic' ? '#3b82f6' : '#6b7280'} />
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: selectedPlan === 'basic' ? '#1e40af' : '#374151' }}>
                                                Basic
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                            €49/mese
                                        </div>
                                    </div>

                                    {/* Premium Plan */}
                                    <div
                                        onClick={() => setSelectedPlan('premium')}
                                        style={{
                                            border: selectedPlan === 'premium' ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: selectedPlan === 'premium' ? '#f5f3ff' : 'white'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Zap size={20} color={selectedPlan === 'premium' ? '#8b5cf6' : '#6b7280'} />
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: selectedPlan === 'premium' ? '#6b21a8' : '#374151' }}>
                                                Premium
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                            €99/mese
                                        </div>
                                    </div>

                                    {/* Enterprise Plan */}
                                    <div
                                        onClick={() => setSelectedPlan('enterprise')}
                                        style={{
                                            border: selectedPlan === 'enterprise' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            background: selectedPlan === 'enterprise' ? '#fffbeb' : 'white'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <Crown size={20} color={selectedPlan === 'enterprise' ? '#f59e0b' : '#6b7280'} />
                                            <div style={{ fontSize: '16px', fontWeight: '600', color: selectedPlan === 'enterprise' ? '#92400e' : '#374151' }}>
                                                Enterprise
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                            €199/mese
                                        </div>
                                    </div>
                                </div>
                            </div>

                            </div>

                            {error && (
                                <div className="edit-org-error">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <div className="edit-org-footer">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                                    Annulla
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    <Send size={18} />
                                    {loading ? 'Generazione...' : 'Genera Invito'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="edit-org-tab-content">
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <div style={{
                                        background: '#dcfce7',
                                        color: '#16a34a',
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 16px'
                                    }}>
                                        <Check size={32} />
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                                        Invito Inviato!
                                    </h3>
                                    <p style={{ color: '#6b7280', fontSize: '14px' }}>
                                        Email inviata con successo a <strong>{invitedEmail}</strong><br />
                                        Puoi anche copiare il link qui sotto se necessario.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Link di Invito</label>
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        alignItems: 'center'
                                    }}>
                                        <input
                                            type="text"
                                            value={inviteLink || ''}
                                            readOnly
                                            className="form-input"
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={copyToClipboard}
                                            className="btn-secondary"
                                            style={{
                                                background: copied ? '#16a34a' : undefined,
                                                color: copied ? 'white' : undefined,
                                                borderColor: copied ? '#16a34a' : undefined,
                                                minWidth: '100px'
                                            }}
                                        >
                                            {copied ? (
                                                <>
                                                    <Check size={18} />
                                                    Copiato!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={18} />
                                                    Copia
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="edit-org-footer">
                                <button type="button" onClick={handleReset} className="btn-secondary">
                                    Nuovo Invito
                                </button>
                                <button type="button" onClick={onClose} className="btn-primary">
                                    Chiudi
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default InviteBusinessModal;
