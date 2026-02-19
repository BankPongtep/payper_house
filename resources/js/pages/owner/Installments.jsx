import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import api from '../../api';

export default function Installments() {
    const { t } = useTranslation();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialStatus = queryParams.get('status') || 'all';

    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(initialStatus);

    useEffect(() => {
        fetchInstallments();
    }, [filterStatus]);

    const fetchInstallments = async () => {
        setLoading(true);
        try {
            let url = '/installments';
            if (filterStatus !== 'all') {
                url += `?status=${filterStatus}`;
            }
            const res = await api.get(url);
            setInstallments(res.data);
        } catch (err) {
            console.error('Failed to fetch installments:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status, dueDate) => {
        const isOverdue = status === 'pending' && new Date(dueDate) < new Date();

        if (status === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    <CheckCircle size={12} />
                    {t('common.paid')}
                </span>
            );
        } else if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    <XCircle size={12} />
                    {t('dashboard.overdue')}
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                    <Clock size={12} />
                    {t('dashboard.pending')}
                </span>
            );
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">{t('menu.installments') || 'Payment Installments'}</h1>

                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        className="bg-transparent border-none focus:ring-0 text-gray-700 text-sm"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">{t('common.all') || 'All'}</option>
                        <option value="paid">{t('dashboard.paid')}</option>
                        <option value="pending">{t('dashboard.pending')}</option>
                        <option value="overdue">{t('dashboard.overdue')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {installments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {t('common.no_data') || 'No installments found'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.contract_number') || 'Contract'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('asset.name') || 'Asset'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('customer.name') || 'Customer'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('installment.due_date') || 'Due Date'}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('installment.amount') || 'Amount'}</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('installment.paid') || 'Paid'}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.action') || 'Action'}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {installments.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                <Link to={`/owner/contracts/${item.contract_id}`}>
                                                    {item.contract?.contract_number}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {item.contract?.asset?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {item.contract?.customer?.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatDate(item.due_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                                ฿{Number(item.amount || item.amount_due || 0).toLocaleString()}
                                                {Number(item.fine_amount) > 0 && (
                                                    <div className="text-xs text-red-500">
                                                        + Fine: ฿{Number(item.fine_amount).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                                ฿{Number(item.paid_amount || item.amount_paid || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getStatusBadge(item.status, item.due_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <Link
                                                    to={`/owner/contracts/${item.contract_id}`}
                                                    className="text-blue-600 hover:text-blue-900 font-medium text-xs border border-blue-200 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
