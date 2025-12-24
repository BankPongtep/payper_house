import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Owner Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Assets</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Contracts</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Payments</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">--</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-4">
                        <Link to="/owner/assets" className="block w-full text-center py-2 px-4 border border-blue-600 text-blue-600 rounded hover:bg-blue-50">Manage Assets</Link>
                        <Link to="/owner/contracts/create" className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Create New Contract</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
