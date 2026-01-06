import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminLayout() {
    const navigate = useNavigate();
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

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-lg">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-blue-600">Payper House</h1>
                    <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
                </div>
                <nav className="mt-6">
                    <Link to="/admin/dashboard" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                        Dashboard
                    </Link>
                    <Link to="/admin/users" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                        User Management
                    </Link>
                    <Link to="/admin/settings" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                        Settings
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6 border-t">
                    <div className="mb-4">
                        <LanguageSwitcher />
                    </div>
                    <div className="flex items-center mb-4">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <p className="text-xs text-gray-500 text-ellipsis overflow-hidden">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 py-2 rounded hover:bg-red-100 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
