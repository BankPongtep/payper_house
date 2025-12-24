import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function CreateContract() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [assets, setAssets] = useState([]);

    const [formData, setFormData] = useState({
        customer_id: '',
        asset_id: '',
        contract_number: `CNT-${Date.now()}`, // Temporary default
        total_price: '',
        down_payment: '0',
        interest_rate: '0',
        installments_count: '12',
        start_date: new Date().toISOString().split('T')[0],
    });

    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchDependencies = async () => {
            const [custRes, assetRes] = await Promise.all([
                api.get('/customers'),
                api.get('/assets')
            ]);
            setCustomers(custRes.data);
            setAssets(assetRes.data.filter(a => a.status === 'available'));
        };
        fetchDependencies();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setPreview(null); // Reset preview on change
    };

    const handleCalculate = async () => {
        try {
            const response = await api.post('/contracts/preview', {
                total_price: formData.total_price,
                down_payment: formData.down_payment,
                interest_rate: formData.interest_rate,
                installments_count: formData.installments_count,
                start_date: formData.start_date,
            });
            setPreview(response.data);
        } catch (err) {
            alert('Preview calculation failed. Check inputs.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!preview) {
            alert('Please Calculate Schedule first');
            return;
        }
        try {
            await api.post('/contracts', formData);
            navigate('/owner/contracts');
        } catch (err) {
            alert('Failed to create contract');
        }
    };

    return (
        <div className="pb-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Contract</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Customer</label>
                                <select name="customer_id" className="w-full border rounded p-2" onChange={handleChange} required>
                                    <option value="">-- Select Customer --</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Asset</label>
                                <select name="asset_id" className="w-full border rounded p-2" onChange={handleChange} required>
                                    <option value="">-- Select Asset --</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.price}฿)</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Contract Number</label>
                            <input name="contract_number" className="w-full border rounded p-2" value={formData.contract_number} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Total Price (Bath)</label>
                                <input name="total_price" type="number" className="w-full border rounded p-2" value={formData.total_price} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Down Payment (Baht)</label>
                                <input name="down_payment" type="number" className="w-full border rounded p-2" value={formData.down_payment} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Interest Rate (%/Year)</label>
                                <input name="interest_rate" type="number" step="0.01" className="w-full border rounded p-2" value={formData.interest_rate} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Installments (Months)</label>
                                <input name="installments_count" type="number" className="w-full border rounded p-2" value={formData.installments_count} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Date</label>
                                <input name="start_date" type="date" className="w-full border rounded p-2" value={formData.start_date} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button type="button" onClick={handleCalculate} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                                Calculate Schedule
                            </button>
                            <button type="submit" disabled={!preview} className={`px-6 py-2 rounded text-white ${preview ? 'bg-blue-600 hover:shadow' : 'bg-blue-300 cursor-not-allowed'}`}>
                                Create Contract
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Schedule Preview</h3>
                    {preview ? (
                        <div>
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                <div><span className="text-gray-500">Principal:</span> ฿{Number(preview.principal).toLocaleString()}</div>
                                <div><span className="text-gray-500">Total Interest:</span> ฿{Number(preview.interest_total).toLocaleString()}</div>
                                <div className="font-bold text-blue-600"><span className="text-gray-500 font-normal">Monthly Pay:</span> ฿{Number(preview.installment_amount).toLocaleString()}</div>
                                <div className="font-bold"><span className="text-gray-500 font-normal">Total Payable:</span> ฿{Number(preview.total_payable).toLocaleString()}</div>
                            </div>

                            <div className="overflow-y-auto max-h-[400px]">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left">#</th>
                                            <th className="px-4 py-2 text-left">Due Date</th>
                                            <th className="px-4 py-2 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {preview.schedule.map((inst, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2">{inst.installment_number}</td>
                                                <td className="px-4 py-2">{inst.due_date}</td>
                                                <td className="px-4 py-2 text-right">฿{Number(inst.amount_due).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center py-10">
                            Enter details and click "Calculate Schedule" to see the payment plan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
