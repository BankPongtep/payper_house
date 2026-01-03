import React from 'react';

export default function AdminDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">Welcome</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-2">Hello, {user?.name}</p>
                </div>
                {/* Stats placeholders */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium">System Status</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">Active</p>
                </div>
            </div>
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                <p className="text-gray-600">User management module coming soon.</p>
            </div>
        </div>
    );
}
