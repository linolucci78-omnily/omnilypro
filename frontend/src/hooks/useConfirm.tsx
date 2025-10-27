import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    options.onConfirm();
    setIsOpen(false);
  }, [options]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    confirm,
    isOpen,
    options,
    handleConfirm,
    handleCancel
  };
};
