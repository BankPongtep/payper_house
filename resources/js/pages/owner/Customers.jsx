import React, { useEffect, useState } from 'react';
import api from '../../api';

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', id_card_number: '', address: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        const response = await api.get('/customers');
        setCustomers(response.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/customers', formData);
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', id_card_number: '', address: '' });
            fetchCustomers();
        } catch (err) {
            alert('Failed to save customer');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Customers Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
                >
                    + Add New Customer
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Card</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map(customer => (
                            <tr key={customer.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.id_card_number}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{customer.address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Customer</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input className="w-full border rounded p-2" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">ID Card Number</label>
                                <input className="w-full border rounded p-2" value={formData.id_card_number} onChange={e => setFormData({ ...formData, id_card_number: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea className="w-full border rounded p-2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
