import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Building2, Users, FileText, Settings, CreditCard } from 'lucide-react';
import api from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function OwnerLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            console.error(e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-600">Payper House</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('common.role')}: {t('common.owner')}</p>
                        </div>
                        <LanguageSwitcher />
                    </div>
                </div>
                <nav className="mt-6">
                    <Link
                        to="/owner/dashboard"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/dashboard')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <Home size={20} />
                        {t('menu.dashboard')}
                    </Link>
                    <Link
                        to="/owner/assets"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/assets')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <Building2 size={20} />
                        {t('menu.assets')}
                    </Link>
                    <Link
                        to="/owner/customers"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/customers')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <Users size={20} />
                        {t('menu.customers')}
                    </Link>
                    <Link
                        to="/owner/contracts"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/contracts')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <FileText size={20} />
                        {t('menu.contracts')}
                    </Link>
                    <Link
                        to="/owner/payments"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/payments')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <CreditCard size={20} />
                        {t('menu.check_payments')}
                    </Link>
                    <Link
                        to="/owner/settings"
                        className={`flex items-center gap-3 px-6 py-3 transition ${isActive('/owner/settings')
                                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                            }`}
                    >
                        <Settings size={20} />
                        {t('menu.settings')}
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6 border-t">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition"
                    >
                        {t('common.logout')}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
