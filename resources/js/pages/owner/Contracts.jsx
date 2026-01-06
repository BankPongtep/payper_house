import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';

export default function Contracts() {
    const { t } = useTranslation();
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

    const getStatusBadge = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800',
            extended: 'bg-purple-100 text-purple-800',
            pending_verification: 'bg-blue-100 text-blue-800',
        };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {t(`contract.status_${status}`) || status}
            </span>
        );
    };

    const getTypeBadge = (type) => {
        return type === 'hire_purchase'
            ? t('contract.type_hire_purchase')
            : t('contract.type_installment');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('contract.management_title')}</h2>
                <Link
                    to="/owner/contracts/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
                >
                    + {t('contract.new_contract')}
                </Link>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder={t('contract.search_placeholder')}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.contract_number')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.customer')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.asset')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.contract_type')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contract.total')}</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map(contract => (
                            <tr key={contract.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:underline cursor-pointer">
                                    <Link to={`/owner/contracts/${contract.id}`}>{contract.contract_number}</Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.customer?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.asset?.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTypeBadge(contract.contract_type || contract.type)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">฿{Number(contract.total_price).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    {getStatusBadge(contract.status)}
                                </td>
                            </tr>
                        ))}
                        {contracts.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                    {t('contract.no_contracts')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
