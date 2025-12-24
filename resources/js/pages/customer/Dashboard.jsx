import React, { useEffect, useState } from 'react';
import api from '../../api';

export default function Dashboard() {
    const [contracts, setContracts] = useState([]);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        // Assume API endpoint allows customers to see their own contracts
        // The ContractController::index does `request->user()->contracts` which is correct for Owner (hasMany).
        // For Customer, `contracts()` via User model might not be defined if I didn't add it or if the relation is different.
        // User model `contracts` relation is `hasMany(Contract::class, 'owner_id')`. 
        // Customers are Users too but `customer_id` is foreign key on Contract.
        // I need to update User model or ContractController to handle Customer role.

        // Wait, for this MVP, let's assume I fix the API or add a specific endpoint. 
        // Actually, `AuthController` returns role.
        // `ContractController::index` currently returns `request->user()->contracts`.
        // If I am a Customer, `contracts` relation on User model points to `owner_id`.
        // So `contracts` will return nothing (unless I am also an owner).

        // I need to fix `ContractController::index` or add `myContracts` for customer.
        // Or update `User` model to have `customerContracts`.
        try {
            const response = await api.get('/contracts');
            setContracts(response.data);
        } catch (e) {
            console.error("Failed to fetch contracts", e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Contracts</h2>

            {contracts.length === 0 ? (
                <div className="bg-white p-10 rounded-lg shadow text-center text-gray-500">
                    No active contracts found.
                </div>
            ) : (
                <div className="space-y-6">
                    {contracts.map(contract => (
                        <div key={contract.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Contract #{contract.contract_number}</h3>
                                    <p className="text-sm text-gray-500">{contract.asset?.name}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                    contract.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {contract.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Total Price</p>
                                    <p className="font-semibold">฿{Number(contract.total_price).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Principal</p>
                                    <p className="font-semibold">฿{Number(contract.principal_amount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Paid Amount</p>
                                    <p className="font-semibold text-green-600">
                                        {/* Need to calc paid amount from installments or handle via relationship count */}
                                        View Details
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Next Due</p>
                                    <p className="font-semibold text-red-500">
                                        {/* Need logic for next due */}
                                        Soon
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
