/**
 * useWeb3 Hook - Manage MetaMask connection state
 */

import { useState, useEffect, useCallback } from 'react'
import { web3Service } from '../services/web3Service'

export interface Web3State {
    isConnected: boolean
    address: string | null
    chainId: number | null
    isLoading: boolean
    error: string | null
}

export const useWeb3 = () => {
    const [state, setState] = useState<Web3State>({
        isConnected: false,
        address: null,
        chainId: null,
        isLoading: false,
        error: null
    })

    const connectWallet = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        try {
            const address = await web3Service.connectWallet()
            const chainId = await web3Service.getChainId()

            setState({
                isConnected: true,
                address,
                chainId,
                isLoading: false,
                error: null
            })

            return address
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }))
            throw error
        }
    }, [])

    const disconnectWallet = useCallback(() => {
        web3Service.disconnect()
        setState({
            isConnected: false,
            address: null,
            chainId: null,
            isLoading: false,
            error: null
        })
    }, [])

    // Listen for account changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum) return

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnectWallet()
            } else {
                setState(prev => ({ ...prev, address: accounts[0] }))
            }
        }

        const handleChainChanged = (chainId: string) => {
            setState(prev => ({ ...prev, chainId: parseInt(chainId, 16) }))
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
            window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
    }, [disconnectWallet])

    return {
        ...state,
        connectWallet,
        disconnectWallet,
        isMetaMaskInstalled: web3Service.isMetaMaskInstalled()
    }
}
