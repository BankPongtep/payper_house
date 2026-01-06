import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Building2, FileText, AlertCircle, TrendingUp, Users, Calendar, Plus, ArrowUpRight, ArrowDownRight, Home } from 'lucide-react';

export default function Dashboard() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_assets: 0,
        vacant_assets: 0,
        active_contracts: 0,
        expiring_contracts: 0,
        expected_revenue: 0,
    });
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [paymentStatus, setPaymentStatus] = useState({ paid: 0, pending: 0, overdue: 0 });
    const [recentContracts, setRecentContracts] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/dashboard/owner-stats');
            setStats(response.data.stats);
            setMonthlyRevenue(response.data.monthly_revenue);
            setPaymentStatus(response.data.payment_status);
            setRecentContracts(response.data.recent_contracts || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

    const pieData = [
        { name: t('dashboard.paid'), value: paymentStatus.paid },
        { name: t('dashboard.pending'), value: paymentStatus.pending },
        { name: t('dashboard.overdue'), value: paymentStatus.overdue },
    ].filter(item => item.value > 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
                <div className="flex gap-3">
                    <Link
                        to="/owner/assets"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
                    >
                        <Plus size={18} />
                        {t('dashboard.add_asset')}
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">{t('dashboard.expected_revenue')}</p>
                            <p className="text-3xl font-bold mt-2">฿{stats.expected_revenue?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm text-blue-100">
                        <span>{t('dashboard.monthly')}</span>
                    </div>
                </div>

                {/* Total Assets */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('dashboard.total_assets')}</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total_assets}</p>
                        </div>
                        <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                            <Building2 size={24} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-sm text-gray-500">{t('dashboard.vacant')}: </span>
                        <span className="text-sm font-medium text-orange-500">{stats.vacant_assets}</span>
                    </div>
                </div>

                {/* Active Contracts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('dashboard.active_contracts')}</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.active_contracts}</p>
                        </div>
                        <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                            <FileText size={24} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link to="/owner/contracts" className="text-sm text-blue-600 hover:underline">
                            {t('dashboard.view_all')} →
                        </Link>
                    </div>
                </div>

                {/* Expiring Contracts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('dashboard.expiring_soon')}</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.expiring_contracts}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stats.expiring_contracts > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <span className="text-sm text-gray-500">{t('dashboard.within_30_days')}</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart - Monthly Revenue */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.monthly_revenue')}</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fill: '#6b7280' }} />
                                <YAxis tick={{ fill: '#6b7280' }} tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(value) => [`฿${value.toLocaleString()}`, t('dashboard.revenue')]}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart - Payment Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.payment_status')}</h3>
                    <div className="h-72">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                {t('dashboard.no_data')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Contracts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{t('dashboard.recent_contracts')}</h3>
                        <Link to="/owner/contracts" className="text-sm text-blue-600 hover:underline">
                            {t('dashboard.view_all')}
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentContracts.length > 0 ? (
                            recentContracts.map((contract) => (
                                <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                            <Home size={18} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{contract.asset?.name}</p>
                                            <p className="text-sm text-gray-500">{contract.customer?.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-800">฿{Number(contract.monthly_rent || 0).toLocaleString()}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${contract.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {contract.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                {t('dashboard.no_recent_contracts')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.quick_actions')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/owner/assets"
                            className="flex flex-col items-center justify-center p-6 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                        >
                            <Building2 size={32} className="mb-2" />
                            <span className="font-medium text-center">{t('dashboard.manage_assets')}</span>
                        </Link>
                        <Link
                            to="/owner/contracts/create"
                            className="flex flex-col items-center justify-center p-6 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition"
                        >
                            <FileText size={32} className="mb-2" />
                            <span className="font-medium text-center">{t('dashboard.new_contract')}</span>
                        </Link>
                        <Link
                            to="/owner/customers"
                            className="flex flex-col items-center justify-center p-6 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition"
                        >
                            <Users size={32} className="mb-2" />
                            <span className="font-medium text-center">{t('dashboard.customers')}</span>
                        </Link>
                        <Link
                            to="/owner/contracts"
                            className="flex flex-col items-center justify-center p-6 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition"
                        >
                            <Calendar size={32} className="mb-2" />
                            <span className="font-medium text-center">{t('dashboard.contracts')}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
