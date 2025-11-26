/**
 * Web3 Service - Blockchain interaction for OMNY Wallet
 * Handles MetaMask connection and network switching
 */

import { ethers } from 'ethers'

const POLYGON_CHAIN_ID = '0x89' // 137 in hex
const POLYGON_RPC_URL = import.meta.env.VITE_POLYGON_RPC_URL || 'https://polygon-rpc.com'

export interface Web3Error {
    code: number
    message: string
}

export class Web3Service {
    private provider: ethers.BrowserProvider | null = null
    private signer: ethers.Signer | null = null

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled(): boolean {
        return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'
    }

    /**
     * Connect to MetaMask wallet
     */
    async connectWallet(): Promise<string> {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask non installato. Installa MetaMask per continuare.')
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum)

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            })

            if (!accounts || accounts.length === 0) {
                throw new Error('Nessun account connesso')
            }

            // Switch to Polygon if needed
            await this.switchToPolygon()

            this.signer = await this.provider.getSigner()
            return accounts[0]
        } catch (error: any) {
            console.error('Error connecting wallet:', error)
            throw this.formatError(error)
        }
    }

    /**
     * Switch network to Polygon Mainnet
     */
    async switchToPolygon(): Promise<void> {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: POLYGON_CHAIN_ID }]
            })
        } catch (switchError: any) {
            // Chain not added to MetaMask
            if (switchError.code === 4902) {
                await this.addPolygonNetwork()
            } else {
                throw switchError
            }
        }
    }

    /**
     * Add Polygon network to MetaMask
     */
    private async addPolygonNetwork(): Promise<void> {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: POLYGON_CHAIN_ID,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: [POLYGON_RPC_URL],
                blockExplorerUrls: ['https://polygonscan.com/']
            }]
        })
    }

    /**
     * Get current connected address
     */
    async getAddress(): Promise<string | null> {
        if (!this.signer) return null
        return await this.signer.getAddress()
    }

    /**
     * Get current network chain ID
     */
    async getChainId(): Promise<number> {
        if (!this.provider) throw new Error('Provider not initialized')
        const network = await this.provider.getNetwork()
        return Number(network.chainId)
    }

    /**
     * Disconnect wallet
     */
    disconnect(): void {
        this.provider = null
        this.signer = null
    }

    /**
     * Get provider instance
     */
    getProvider(): ethers.BrowserProvider | null {
        return this.provider
    }

    /**
     * Get signer instance
     */
    getSigner(): ethers.Signer | null {
        return this.signer
    }

    /**
     * Format error messages
     */
    private formatError(error: any): Error {
        if (error.code === 4001) {
            return new Error('Connessione rifiutata dall\'utente')
        }
        if (error.code === -32002) {
            return new Error('Richiesta già in sospeso. Controlla MetaMask.')
        }
        return new Error(error.message || 'Errore sconosciuto')
    }
}

export const web3Service = new Web3Service()
