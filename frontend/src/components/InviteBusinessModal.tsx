import React, { useState } from 'react';
import { X, Mail, Copy, Check, Send, Crown, Zap, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emailService } from '../services/emailService';
import './EditOrganizationModal.css'; // Reuse styles

interface InviteBusinessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = 'basic' | 'premium' | 'enterprise';

const InviteBusinessModal: React.FC<InviteBusinessModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError(null);

        try {
            // Generate a unique token
            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            // Save to database
            const { error: dbError } = await supabase
                .from('organization_invites')
                .insert({
                    email,
                    token,
                    status: 'pending',
                    role: 'owner',
                    plan_type: selectedPlan
                });

            if (dbError) throw dbError;

            // Generate link
            const link = `${window.location.origin}/register?invite=${token}`;
            setInviteLink(link);

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
        setEmail('');
        setInviteLink(null);
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div className="modal-title">
                        <Send size={24} className="text-primary" />
                        <h2>Invita Azienda</h2>
                    </div>
                    <button onClick={onClose} className="modal-close">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {!inviteLink ? (
                        <form onSubmit={handleInvite}>
                            <p className="text-gray-600 mb-4">
                                Inserisci l'email del proprietario dell'azienda. Genereremo un link di invito che potrai inviare via WhatsApp o Email.
                            </p>

                            <div className="form-group">
                                <label>Email Proprietario</label>
                                <div className="input-with-icon">
                                    <Mail size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="mario@pizzeria.it"
                                        required
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Seleziona Piano</label>
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

                            {error && (
                                <div className="error-message" style={{ marginTop: '10px' }}>
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                                    Annulla
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Generazione...' : 'Genera Invito'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="invite-success">
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px'
                                }}>
                                    <Check size={30} />
                                </div>
                                <h3>Invito Inviato!</h3>
                                <p className="text-gray-600">
                                    Email inviata con successo a <strong>{email}</strong>. Puoi anche copiare il link qui sotto se necessario.
                                </p>
                            </div>

                            <div style={{
                                background: '#f3f4f6',
                                padding: '15px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '20px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <code style={{
                                    flex: 1,
                                    wordBreak: 'break-all',
                                    fontSize: '14px',
                                    color: '#4b5563'
                                }}>
                                    {inviteLink}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    style={{
                                        background: copied ? '#16a34a' : 'white',
                                        color: copied ? 'white' : '#4b5563',
                                        border: copied ? 'none' : '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Copia Link"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>

                            <div className="modal-actions">
                                <button onClick={handleReset} className="btn-secondary">
                                    Nuovo Invito
                                </button>
                                <button onClick={onClose} className="btn-primary">
                                    Chiudi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InviteBusinessModal;
