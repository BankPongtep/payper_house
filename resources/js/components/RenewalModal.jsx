import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import api from '../api';
import { X } from 'lucide-react';

export default function RenewalModal({ isOpen, onClose, contract, onSuccess }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        total_price: '',
        interest_rate: '',
        installments_count: 12,
        start_date: new Date().toISOString().split('T')[0],
        contract_type: 'hire_purchase',
        balloon_percent: 0
    });

    useEffect(() => {
        if (contract && isOpen) {
            // Default to balloon payment, or principal amount if no balloon
            const renewalAmount = contract.balloon_payment > 0 ? contract.balloon_payment : (contract.principal_amount || 0);

            setFormData(prev => ({
                ...prev,
                total_price: renewalAmount,
                interest_rate: contract.interest_rate || 0,
                contract_type: contract.contract_type || 'hire_purchase',
                balloon_percent: 0
            }));
        }
    }, [contract, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/contracts/${contract.id}/renew`, formData);
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('contract.renew_success'),
                timer: 1500,
                showConfirmButton: false
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: error.response?.data?.message || 'Failed to renew contract'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{t('contract.renew_title')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4 flex items-start">
                        <span className="mr-2">ℹ️</span>
                        {t('contract.renew_description')}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('contract.renewal_amount')}
                        </label>
                        <input
                            type="number"
                            name="total_price"
                            value={formData.total_price}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-100"
                            readOnly
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('contract.interest_rate')} (%)
                            </label>
                            <input
                                type="number"
                                name="interest_rate"
                                value={formData.interest_rate}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('contract.installments_count')} ({t('contract.months')})
                            </label>
                            <input
                                type="number"
                                name="installments_count"
                                value={formData.installments_count}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                required
                                min="1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('contract.start_date')}
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('contract.balloon_percent')} (%)
                        </label>
                        <p className="text-xs text-gray-500 mb-1">{t('contract.balloon_hint')}</p>
                        <input
                            type="number"
                            name="balloon_percent"
                            value={formData.balloon_percent}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            disabled={loading}
                        >
                            {loading ? t('common.loading') : t('contract.renew_contract')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
