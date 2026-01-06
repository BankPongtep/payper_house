import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, Calendar, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api';

export default function CustomerDashboard() {
    const { t } = useTranslation();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDebt: 0,
        nextPaymentAmount: 0,
        nextPaymentDate: null,
        activeContracts: 0
    });

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const res = await api.get('/customer/contracts');
            const data = res.data;
            setContracts(data);
            calculateStats(data);
        } catch (e) {
            console.error("Failed to fetch contracts", e);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (contractsData) => {
        let totalDebt = 0;
        let nextPayment = { amount: 0, date: null };
        let activeCount = 0;

        const now = new Date();

        contractsData.forEach(contract => {
            if (contract.status === 'active') {
                activeCount++;

                // Calculate remaining balance from pending installments
                const pending = contract.installments?.filter(i => i.status === 'pending') || [];
                const contractDebt = pending.reduce((sum, i) => sum + parseFloat(i.amount), 0);
                totalDebt += contractDebt;

                // Find next payment (earliest pending due date)
                if (pending.length > 0) {
                    // Sort by due date
                    const sorted = [...pending].sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                    const next = sorted[0];
                    const nextDate = new Date(next.due_date);

                    if (!nextPayment.date || nextDate < nextPayment.date) {
                        nextPayment = {
                            amount: parseFloat(next.amount),
                            date: nextDate
                        };
                    }
                }
            }
        });

        setStats({
            totalDebt,
            nextPaymentAmount: nextPayment.amount,
            nextPaymentDate: nextPayment.date,
            activeContracts: activeCount
        });
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('menu.dashboard')}</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Balance */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm font-medium mb-1">{t('dashboard.total_debt')}</p>
                        <h3 className="text-3xl font-bold">฿{stats.totalDebt.toLocaleString()}</h3>
                    </div>
                    <CreditCard className="absolute right-4 bottom-4 text-white/20 w-16 h-16" />
                </div>

                {/* Next Payment */}
                <div className="bg-white rounded-xl p-6 shadow border border-gray-100 relative overflow-hidden">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{t('dashboard.next_payment')}</p>
                        {stats.nextPaymentDate ? (
                            <>
                                <h3 className="text-2xl font-bold text-gray-800">฿{stats.nextPaymentAmount.toLocaleString()}</h3>
                                <p className={`text-sm mt-1 flex items-center gap-1 ${stats.nextPaymentDate < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                    <Calendar size={14} />
                                    {formatDate(stats.nextPaymentDate)}
                                </p>
                            </>
                        ) : (
                            <p className="text-gray-400 mt-2">{t('dashboard.no_pending')}</p>
                        )}
                    </div>
                    <AlertCircle className="absolute right-4 bottom-4 text-red-50 w-16 h-16" />
                </div>

                {/* Active Contracts */}
                <div className="bg-white rounded-xl p-6 shadow border border-gray-100 relative overflow-hidden">
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{t('dashboard.active_contracts')}</p>
                        <h3 className="text-3xl font-bold text-gray-800">{stats.activeContracts}</h3>
                        <Link to="/customer/contracts" className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
                            {t('dashboard.view_all')} <TrendingUp size={14} />
                        </Link>
                    </div>
                    <FileText className="absolute right-4 bottom-4 text-blue-50 w-16 h-16" />
                </div>
            </div>

            {/* Recent Contracts */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">{t('dashboard.recent_activity')}</h3>
                    <Link to="/customer/contracts" className="text-sm text-blue-600 hover:underline">
                        {t('dashboard.view_all')}
                    </Link>
                </div>
                <div className="divide-y">
                    {contracts.slice(0, 3).map(contract => (
                        <div key={contract.id} className="p-6 hover:bg-gray-50 transition">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{contract.asset?.name}</p>
                                        <p className="text-sm text-gray-500">{contract.contract_number}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {contract.status === 'active' ? <CheckCircle size={12} /> : null}
                                        {t(`contract.status_${contract.status}`) || contract.status}
                                    </span>
                                    <Link to={`/customer/contracts/${contract.id}`} className="block text-sm text-blue-600 hover:underline mt-1">
                                        {t('common.actions')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {contracts.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            {t('customer.no_contracts')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
