import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { Printer, Download } from 'lucide-react';

export default function Receipt() {
    const { t } = useTranslation();
    const { id } = useParams(); // Receipt ID
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    const fetchReceipt = async () => {
        try {
            // Need an API endpoint for fetching receipt by ID
            // For now assuming /api/receipts/{id} exists or we use existing contract/installment data?
            // Better to create a dedicated endpoint: /api/receipts/{id}
            const res = await api.get(`/receipts/${id}`);
            setReceipt(res.data);
        } catch (err) {
            console.error('Failed to fetch receipt', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!receipt) return <div className="p-10 text-center">Receipt not found</div>;

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg my-10 border print:shadow-none print:border-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">RECEIPT</h1>
                    <p className="text-gray-500 mt-1">{t('contract.receipt')} #{receipt.receipt_number}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-blue-600">Payper House</h2>
                    <p className="text-sm text-gray-500">123 Payment Street</p>
                    <p className="text-sm text-gray-500">Bangkok, Thailand</p>
                </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-sm text-gray-500 uppercase mb-1">{t('payment.bill_to')}</p>
                    <p className="font-bold text-gray-800">{receipt.contract?.customer?.name}</p>
                    <p className="text-sm text-gray-600">{receipt.contract?.customer?.phone}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase mb-1">{t('payment.payment_details')}</p>
                    <p className="text-sm"><span className="font-medium">{t('payment.date')}:</span> {receipt.paid_at ? receipt.paid_at.toString().substring(0, 16) : '-'}</p>
                    <p className="text-sm"><span className="font-medium">{t('contract.contract_number')}:</span> {receipt.contract?.contract_number}</p>
                </div>
            </div>

            {/* Table */}
            <div className="mb-8">
                <table className="w-full">
                    <thead className="bg-gray-50 border-y">
                        <tr>
                            <th className="py-3 text-left text-sm font-semibold text-gray-600 pl-4">{t('payment.description')}</th>
                            <th className="py-3 text-right text-sm font-semibold text-gray-600 pr-4">{t('payment.amount')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="py-4 pl-4">
                                <p className="font-medium text-gray-800">
                                    {t('contract.installment')} #{receipt.installment_id}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {t('contract.asset')}: {receipt.contract?.asset?.name}
                                </p>
                            </td>
                            <td className="py-4 text-right pr-4 font-medium">
                                ฿{Number(receipt.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="border-t border-gray-200">
                        <tr>
                            <td className="py-4 pl-4 text-right font-bold text-gray-800">{t('contract.total')}</td>
                            <td className="py-4 text-right pr-4 font-bold text-blue-600 text-xl">
                                ฿{Number(receipt.amount).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t text-gray-500 text-sm">
                <p>{t('payment.thank_you')}</p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-center gap-4 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow"
                >
                    <Printer size={18} />
                    {t('contract.print')}
                </button>
            </div>
        </div>
    );
}
