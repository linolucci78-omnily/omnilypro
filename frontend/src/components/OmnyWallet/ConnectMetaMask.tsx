import React from 'react'
import { Wallet, AlertCircle } from 'lucide-react'
import { useWeb3 } from '../../hooks/useWeb3'
import { useToast } from '../../contexts/ToastContext'
import './ConnectMetaMask.css'

const ConnectMetaMask: React.FC = () => {
    const { isConnected, address, isLoading, error, connectWallet, disconnectWallet, isMetaMaskInstalled } = useWeb3()
    const { showSuccess, showError } = useToast()

    const handleConnect = async () => {
        try {
            await connectWallet()
            showSuccess('Wallet Connesso', 'MetaMask connesso con successo!')
        } catch (err: any) {
            showError('Errore Connessione', err.message)
        }
    }

    const handleDisconnect = () => {
        disconnectWallet()
        showSuccess('Wallet Disconnesso', 'MetaMask disconnesso')
    }

    if (!isMetaMaskInstalled) {
        return (
            <div className="metamask-not-installed">
                <AlertCircle size={40} />
                <h3>MetaMask Richiesto</h3>
                <p>Installa MetaMask per utilizzare OMNY Wallet</p>
                <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-install-metamask"
                >
                    Installa MetaMask
                </a>
            </div>
        )
    }

    if (isConnected && address) {
        return (
            <div className="metamask-connected">
                <div className="connected-badge">
                    <div className="status-dot"></div>
                    <span>Connesso</span>
                </div>
                <div className="address-display">
                    {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                <button onClick={handleDisconnect} className="btn-disconnect">
                    Disconnetti
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isLoading}
            className="btn-connect-metamask"
        >
            <Wallet size={20} />
            {isLoading ? 'Connessione...' : 'Connetti MetaMask'}
        </button>
    )
}

export default ConnectMetaMask
