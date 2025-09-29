import { useState, useCallback } from 'react'

interface ConfirmState {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'danger' | 'info'
  onConfirm?: () => void
}

export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    type: 'warning'
  })

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string
      confirmText?: string
      cancelText?: string
      type?: 'warning' | 'danger' | 'info'
    }
  ) => {
    setConfirmState({
      isOpen: true,
      message,
      onConfirm,
      title: options?.title,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      type: options?.type || 'warning'
    })
  }, [])

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false
    }))
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmState.onConfirm) {
      confirmState.onConfirm()
    }
    hideConfirm()
  }, [confirmState.onConfirm, hideConfirm])

  return {
    confirmState,
    showConfirm,
    hideConfirm,
    handleConfirm
  }
}