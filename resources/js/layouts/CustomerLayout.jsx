import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function CustomerLayout() {
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
        <div className="flex h-screen bg-gray-50">
            {/* Navbar */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <header className="bg-white shadow">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-blue-600">Payper House</h1>
                            <span className="ml-4 text-xs bg-gray-100 text-gray-600 py-1 px-2 rounded-full">Customer Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
