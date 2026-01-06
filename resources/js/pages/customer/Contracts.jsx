import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function CustomerContracts() {
    const { t } = useTranslation();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const res = await api.get('/customer/contracts');
            setContracts(res.data);
        } catch (err) {
            console.error('Failed to fetch contracts:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: t('contract.status_active') },
            completed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: t('contract.status_completed') },
            pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: t('contract.status_pending') },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.color}`}>
                <Icon size={12} />
                {c.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('customer.my_contracts')}</h1>

            {contracts.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border">
                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>{t('customer.no_contracts')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {contracts.map((contract) => (
                        <Link
                            key={contract.id}
                            to={`/customer/contracts/${contract.id}`}
                            className="block bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{contract.asset?.name}</h3>
                                        <p className="text-sm text-gray-500">{contract.contract_number}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800">
                                        ฿{Number(contract.installment_amount || 0).toLocaleString()}/{t('common.month')}
                                    </p>
                                    {getStatusBadge(contract.status)}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-sm text-gray-500 mb-1">
                                    <span>{t('customer.paid_installments')}</span>
                                    <span>{contract.paid_installments_count || 0} / {contract.installments_count || 0}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{
                                            width: `${contract.installments_count > 0
                                                ? (contract.paid_installments_count / contract.installments_count) * 100
                                                : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
