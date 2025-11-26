import React from 'react'
import OmnyWalletHub from '../components/OmnyWallet/OmnyWalletHub'

const OmnyWalletTestPage: React.FC = () => {
    return (
        <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                        OMNY Wallet - Test Page
                    </h1>
                    <p style={{ margin: 0, color: '#64748b' }}>
                        Pagina di test per visualizzare e testare il wallet OMNY
                    </p>
                </div>

                <OmnyWalletHub
                    organizationId="test-org-id"
                    primaryColor="#667eea"
                    secondaryColor="#764ba2"
                />
            </div>
        </div>
    )
}

export default OmnyWalletTestPage
