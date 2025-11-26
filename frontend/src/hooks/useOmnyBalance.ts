/**
 * useOmnyBalance Hook - Fetch and manage OMNY token balance
 */

import { useState, useEffect, useCallback } from 'react'
import { omnyService, type OmnyBalance } from '../services/omnyService'

export const useOmnyBalance = (address: string | null) => {
    const [balance, setBalance] = useState<OmnyBalance | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchBalance = useCallback(async () => {
        if (!address) {
            setBalance(null)
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const bal = await omnyService.getBalance(address)
            setBalance(bal)
        } catch (err: any) {
            console.error('Error fetching OMNY balance:', err)
            setError(err.message)
            setBalance(null)
        } finally {
            setIsLoading(false)
        }
    }, [address])

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    return {
        balance,
        isLoading,
        error,
        refetch: fetchBalance
    }
}
