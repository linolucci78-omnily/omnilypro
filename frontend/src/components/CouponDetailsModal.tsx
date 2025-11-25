/**
 * Coupon Details Modal - Placeholder
 *
 * Full-page modal for displaying coupon details
 * To be fully implemented with same style as GiftCertificateDetailsModal
 */

import React from 'react';
import { X, Ticket, Calendar, TrendingUp, Tag, AlertCircle } from 'lucide-react';
import type { Coupon } from '../types/coupon';

interface CouponDetailsModalProps {
  isOpen: boolean;
  coupon: Coupon | null;
  onClose: () => void;
  organizationName: string;
}

const CouponDetailsModal: React.FC<CouponDetailsModalProps> = ({
  isOpen,
  coupon,
  onClose,
  organizationName
}) => {
  if (!isOpen || !coupon) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}%`;
    } else if (coupon.type === 'fixed_amount') {
      return formatCurrency(Number(coupon.value));
    } else {
      return String(coupon.value);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white flex items-center justify-center z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-xl font-black text-gray-900">
            Dettagli Coupon
          </h2>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          {/* Coupon Header */}
          <div className="bg-gradient-to-br from-red-600 via-red-500 to-rose-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Ticket className="w-8 h-8" />
                <div>
                  <h3 className="text-2xl font-black">{coupon.title}</h3>
                  <p className="text-red-50 text-sm mt-1">{coupon.description}</p>
                </div>
              </div>
              {coupon.is_flash && (
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                  FLASH
                </span>
              )}
            </div>

            <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <div className="text-sm font-semibold mb-2 opacity-90">Codice Coupon</div>
              <div className="text-3xl font-black tracking-wider font-mono">{coupon.code}</div>
            </div>

            <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
              <div className="text-sm font-semibold mb-2 opacity-90">Sconto</div>
              <div className="text-4xl font-black">{formatValue(coupon)}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Valido Dal</span>
              </div>
              <div className="font-bold text-gray-900">{formatDate(coupon.valid_from)}</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Valido Fino</span>
              </div>
              <div className="font-bold text-gray-900">{formatDate(coupon.valid_until)}</div>
            </div>

            {coupon.usage_limit && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Utilizzi</span>
                </div>
                <div className="font-bold text-gray-900">
                  {coupon.current_usage} / {coupon.usage_limit}
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Tag className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Stato</span>
              </div>
              <div className="font-bold text-gray-900 capitalize">{coupon.status}</div>
            </div>
          </div>

          {/* Additional Info */}
          {(coupon.min_purchase_amount || coupon.max_discount_amount || coupon.terms_conditions) && (
            <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h4 className="font-black text-gray-900">Condizioni</h4>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                {coupon.min_purchase_amount && (
                  <div>• Acquisto minimo: <strong>{formatCurrency(coupon.min_purchase_amount)}</strong></div>
                )}
                {coupon.max_discount_amount && (
                  <div>• Sconto massimo: <strong>{formatCurrency(coupon.max_discount_amount)}</strong></div>
                )}
                {coupon.usage_per_customer && (
                  <div>• Limite per cliente: <strong>{coupon.usage_per_customer} utilizzi</strong></div>
                )}
                {coupon.first_purchase_only && (
                  <div>• <strong>Solo primo acquisto</strong></div>
                )}
                {coupon.terms_conditions && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <strong>Termini e Condizioni:</strong>
                    <p className="mt-1">{coupon.terms_conditions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base hover:bg-gray-800 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponDetailsModal;
