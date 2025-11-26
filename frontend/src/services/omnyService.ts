/**
 * OMNY Token Service - Smart Contract Interaction
 * Handles OMNY token operations on Polygon blockchain
 */

import { ethers } from 'ethers'
import { web3Service } from './web3Service'

const OMNY_CONTRACT_ADDRESS = import.meta.env.VITE_OMNY_CONTRACT_ADDRESS || '0xe62CCDc664993336bB400B725Fb9C0A8Cd1895f4'

// Minimal ABI - solo le funzioni che usiamo
const OMNY_ABI = [
    // Read functions
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',

    // Write functions
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)'
]

export interface OmnyBalance {
    raw: bigint
    formatted: string
    decimals: number
}

export class OmnyService {
    private contract: ethers.Contract | null = null

    /**
     * Initialize contract instance
     */
    async initialize(): Promise<void> {
        const provider = web3Service.getProvider()
        if (!provider) {
            throw new Error('Provider not initialized. Connect wallet first.')
        }

        const signer = web3Service.getSigner()
        if (!signer) {
            throw new Error('Signer not available')
        }

        this.contract = new ethers.Contract(OMNY_CONTRACT_ADDRESS, OMNY_ABI, signer)
    }

    /**
     * Get OMNY balance for an address
     */
    async getBalance(address: string): Promise<OmnyBalance> {
        if (!this.contract) await this.initialize()
        if (!this.contract) throw new Error('Contract not initialized')

        try {
            const balance = await this.contract.balanceOf(address)
            const decimals = await this.contract.decimals()

            return {
                raw: balance,
                formatted: ethers.formatUnits(balance, decimals),
                decimals: Number(decimals)
            }
        } catch (error) {
            console.error('Error getting balance:', error)
            throw new Error('Errore nel recupero del saldo OMNY')
        }
    }

    /**
     * Transfer OMNY tokens
     */
    async transfer(to: string, amount: string): Promise<string> {
        if (!this.contract) await this.initialize()
        if (!this.contract) throw new Error('Contract not initialized')

        try {
            const decimals = await this.contract.decimals()
            const amountWei = ethers.parseUnits(amount, decimals)

            const tx = await this.contract.transfer(to, amountWei)
            await tx.wait()

            return tx.hash
        } catch (error: any) {
            console.error('Error transferring OMNY:', error)
            throw new Error(error.message || 'Errore nel trasferimento OMNY')
        }
    }

    /**
     * Get token info
     */
    async getTokenInfo(): Promise<{ name: string; symbol: string; decimals: number }> {
        if (!this.contract) await this.initialize()
        if (!this.contract) throw new Error('Contract not initialized')

        const [name, symbol, decimals] = await Promise.all([
            this.contract.name(),
            this.contract.symbol(),
            this.contract.decimals()
        ])

        return {
            name,
            symbol,
            decimals: Number(decimals)
        }
    }

    /**
     * Format OMNY amount for display
     */
    formatOmny(amount: string | bigint, decimals: number = 18): string {
        const formatted = typeof amount === 'string'
            ? amount
            : ethers.formatUnits(amount, decimals)

        return new Intl.NumberFormat('it-IT', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(parseFloat(formatted))
    }

    /**
     * Calculate euro equivalent (10 OMNY = 1 EUR)
     */
    omnyToEuro(omnyAmount: string): number {
        return parseFloat(omnyAmount) / 10
    }

    /**
     * Calculate OMNY equivalent (1 EUR = 10 OMNY)
     */
    euroToOmny(euroAmount: number): string {
        return (euroAmount * 10).toString()
    }
}

export const omnyService = new OmnyService()
