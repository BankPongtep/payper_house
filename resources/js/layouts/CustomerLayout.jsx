import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, LogOut, Settings } from 'lucide-react';
import api from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NotificationBell from '../components/NotificationBell';

export default function CustomerLayout() {
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
            {/* Sidebar content unchanged ... */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
                <header className="bg-white shadow-sm h-16 flex items-center justify-end px-6">
                    <NotificationBell />
                </header>
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
