import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Contracts() {
    const [contracts, setContracts] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchContracts();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const fetchContracts = async () => {
        const response = await api.get('/contracts', {
            params: { search: search }
        });
        setContracts(response.data);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Contracts Management</h2>
                <Link
                    to="/owner/contracts/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
                >
                    + New Contract
                </Link>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by contract number, customer name, or ID card..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map(contract => (
                            <tr key={contract.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                                    <Link to={`/owner/contracts/${contract.id}`}>{contract.contract_number}</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.customer?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.asset?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{contract.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">฿{Number(contract.total_price).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                        contract.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {contract.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
