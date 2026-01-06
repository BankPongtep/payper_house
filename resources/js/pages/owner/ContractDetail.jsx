import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, Printer } from 'lucide-react';
import api from '../../api';

export default function ContractDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const response = await api.get(`/contracts/${id}`);
            setContract(response.data);
        } catch (err) {
            console.error('Failed to fetch contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return dateString.split('T')[0];
    };

    const handlePrint = () => {
        window.open(`/owner/contracts/${id}/print`, '_blank');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            pending_verification: { color: 'bg-blue-100 text-blue-800', icon: Clock },
            paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
            partial: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
        };
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${config.color}`}>
                <Icon size={12} />
                {t(`contract.status_${status}`) || status}
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

    if (!contract) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">{t('contract.not_found')}</p>
                <Link to="/owner/contracts" className="text-blue-600 hover:underline mt-2 inline-block">
                    {t('contract.back_to_list')}
                </Link>
            </div>
        );
    }

    const tabs = [
        { id: 'info', label: t('contract.tab_info'), icon: FileText },
        { id: 'installments', label: t('contract.tab_installments'), icon: Calendar },
        { id: 'payments', label: t('contract.tab_payments'), icon: CreditCard },
    ];

    const paidCount = contract.installments?.filter(i => i.status === 'paid').length || 0;
    const totalCount = contract.installments?.length || 0;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/owner/contracts" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{contract.contract_number}</h2>
                    <p className="text-gray-500">{contract.customer?.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
                    >
                        <Printer size={18} />
                        {t('contract.print')}
                    </button>
                    {getStatusBadge(contract.status)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">{t('contract.payment_progress')}</span>
                    <span className="font-medium">{paidCount} / {totalCount} {t('contract.installments_paid')}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.contract_info')}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">{t('contract.contract_number')}</span>
                                        <p className="font-medium">{contract.contract_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.contract_type')}</span>
                                        <p className="font-medium">{t(`contract.type_${contract.contract_type}`) || contract.contract_type}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.start_date')}</span>
                                        <p className="font-medium">{contract.start_date}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.end_date')}</span>
                                        <p className="font-medium">{contract.end_date || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.financial_info')}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">{t('contract.total_price')}</span>
                                        <p className="font-medium text-lg">฿{Number(contract.total_price).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.down_payment')}</span>
                                        <p className="font-medium">฿{Number(contract.down_payment).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.principal')}</span>
                                        <p className="font-medium">฿{Number(contract.principal_amount).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.interest_rate')}</span>
                                        <p className="font-medium">{contract.interest_rate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.monthly_pay')}</span>
                                        <p className="font-medium text-blue-600">฿{Number(contract.installment_amount).toLocaleString()}</p>
                                    </div>
                                    {contract.balloon_payment > 0 && (
                                        <div>
                                            <span className="text-gray-500">{t('contract.balloon_payment')}</span>
                                            <p className="font-medium text-amber-600">฿{Number(contract.balloon_payment).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.customer_info')}</h3>
                                <div className="text-sm space-y-2">
                                    <p><span className="text-gray-500">{t('common.name')}:</span> {contract.customer?.name}</p>
                                    <p><span className="text-gray-500">{t('common.phone')}:</span> {contract.customer?.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.asset_info')}</h3>
                                <div className="text-sm space-y-2">
                                    <p><span className="text-gray-500">{t('common.name')}:</span> {contract.asset?.name}</p>
                                    <p><span className="text-gray-500">{t('asset.type')}:</span> {contract.asset?.type || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Installments Tab */}
                    {activeTab === 'installments' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('contract.due_date')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.amount')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.paid_amount')}</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contract.installments?.map((inst, idx) => (
                                        <tr key={inst.id} className={inst.status === 'overdue' ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                                            <td className="px-4 py-3 text-sm">{formatDate(inst.due_date)}</td>
                                            <td className="px-4 py-3 text-sm text-right">฿{Number(inst.amount).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right">฿{Number(inst.paid_amount || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">{getStatusBadge(inst.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!contract.installments || contract.installments.length === 0) && (
                                <p className="text-center text-gray-500 py-8">{t('contract.no_installments')}</p>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div>
                            {contract.receipts && contract.receipts.length > 0 ? (
                                <div className="space-y-4">
                                    {contract.receipts.map(receipt => (
                                        <div key={receipt.id} className="border rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{t('contract.receipt')} #{receipt.receipt_number}</p>
                                                <p className="text-sm text-gray-500">{receipt.paid_at}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">฿{Number(receipt.amount).toLocaleString()}</p>
                                                <p className="text-sm text-gray-500">{receipt.payment_method}</p>
                                                <Link to={`/receipts/${receipt.id}`} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 block">
                                                    {t('contract.receipt')}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">{t('contract.no_payments')}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
