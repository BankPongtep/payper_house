import React, { useEffect, useState } from 'react';
import api from '../../api';

export default function Assets() {
    const [assets, setAssets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', status: 'available' });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        const response = await api.get('/assets');
        setAssets(response.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/assets', formData);
            setIsModalOpen(false);
            setFormData({ name: '', description: '', price: '', status: 'available' });
            fetchAssets();
        } catch (err) {
            alert('Failed to save asset');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Assets Management</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
                >
                    + Add New Asset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map(asset => (
                    <div key={asset.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                        <div className="h-32 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-500">
                            {/* Placeholder for Image */}
                            [Image]
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{asset.name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{asset.description || 'No description'}</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${asset.status === 'available' ? 'bg-green-100 text-green-800' :
                                    asset.status === 'leased' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                    {asset.status.toUpperCase()}
                                </span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">฿{Number(asset.price).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add Asset</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border rounded p-2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Price (Value)</label>
                                <input type="number" className="w-full border rounded p-2" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
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
