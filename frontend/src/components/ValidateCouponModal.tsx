/**
 * Validate Coupon Modal - Placeholder
 *
 * Full-page modal for validating coupons by code
 * To be fully implemented with same style as ValidateGiftCertificateModal
 */

import React, { useState } from 'react';
import { X, QrCode, Search, CheckCircle, Ticket } from 'lucide-react';
import type { ValidateCouponResponse } from '../types/coupon';

interface ValidateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onValidate: (code: string) => Promise<ValidateCouponResponse>;
  organizationId: string;
  organizationName: string;
  prefilledCode?: string;
}

const ValidateCouponModal: React.FC<ValidateCouponModalProps> = ({
  isOpen,
  onClose,
  onValidate,
  organizationId,
  organizationName,
  prefilledCode
}) => {
  const [code, setCode] = useState(prefilledCode || '');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidateCouponResponse | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    try {
      const response = await onValidate(code);
      setResult(response);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-black text-gray-900">
            Valida Coupon
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {/* Search Input */}
          <div>
            <label className="block text-gray-600 text-xs font-bold mb-2 uppercase tracking-wide">
              Codice Coupon
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER2024"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:outline-none font-mono font-bold text-lg"
              />
              <button
                onClick={handleValidate}
                disabled={isValidating || !code.trim()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-6 rounded-2xl ${result.valid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
              <div className="flex items-center gap-3 mb-4">
                {result.valid ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h3 className="font-black text-lg">
                    {result.valid ? 'Coupon Valido!' : 'Coupon Non Valido'}
                  </h3>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>

              {result.valid && result.coupon && (
                <div className="mt-4 p-4 bg-white rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-5 h-5 text-gray-600" />
                    <span className="font-bold">{result.coupon.title}</span>
                  </div>
                  <p className="text-sm text-gray-600">{result.coupon.description}</p>
                  {result.discount_amount && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Sconto Applicato</span>
                      <div className="text-2xl font-black text-green-600">
                        €{result.discount_amount.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidateCouponModal;
