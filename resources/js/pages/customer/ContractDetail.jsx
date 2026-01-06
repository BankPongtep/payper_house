import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, QrCode, Building2, Upload, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api';

export default function CustomerContractDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('installments');
    const [selectedInstallment, setSelectedInstallment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const res = await api.get(`/customer/contracts/${id}`);
            setContract(res.data);
            // Set default installment to first pending
            const pending = res.data.installments?.find(i => i.status === 'pending');
            if (pending) setSelectedInstallment(pending.id);
        } catch (err) {
            console.error('Failed to fetch contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return dateString.split('T')[0];
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
            pending_verification: { color: 'bg-blue-100 text-blue-700', icon: Clock },
            paid: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
            overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.color}`}>
                <Icon size={12} />
                {t(`contract.status_${status}`) || status}
            </span>
        );
    };

    const isOverdue = (dueDate, status) => {
        if (status === 'paid') return false;
        return new Date(dueDate) < new Date();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmitProof = async () => {
        if (!selectedInstallment || !selectedFile) {
            Swal.fire({ icon: 'warning', text: t('payment.select_installment_and_file') });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('installment_id', selectedInstallment);
        formData.append('image', selectedFile);

        try {
            await api.post('/customer/payments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('payment.submitted_success'),
                timer: 2000,
                showConfirmButton: false
            });
            setSelectedFile(null);
            setPreviewUrl(null);
            fetchContract();
        } catch (err) {
            Swal.fire({ icon: 'error', text: t('payment.submit_failed') });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">{t('contract.not_found')}</p>
                <Link to="/customer/contracts" className="text-blue-600 hover:underline mt-2 inline-block">
                    {t('contract.back_to_list')}
                </Link>
            </div>
        );
    }

    const paidCount = contract.installments?.filter(i => i.status === 'paid').length || 0;
    const totalCount = contract.installments?.length || 0;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    const nextInstallment = contract.installments?.find(i => i.status === 'pending');
    const pendingInstallments = contract.installments?.filter(i => i.status === 'pending') || [];

    return (
        <div className="p-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/customer/contracts" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{contract.asset?.name}</h2>
                    <p className="text-gray-500">{contract.contract_number}</p>
                </div>
            </div>

            {/* Progress Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="text-blue-100 text-sm">{t('customer.monthly_payment')}</p>
                        <p className="text-3xl font-bold">฿{Number(contract.installment_amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-blue-100 text-sm">{t('customer.progress')}</p>
                        <p className="text-2xl font-bold">{paidCount}/{totalCount} {t('customer.installments')}</p>
                    </div>
                </div>
                <div className="w-full bg-white/30 rounded-full h-3">
                    <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            {/* Next Payment Alert */}
            {nextInstallment && (
                <div className={`p-4 rounded-xl mb-6 flex items-center gap-4 ${isOverdue(nextInstallment.due_date, nextInstallment.status) ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className={`p-3 rounded-full ${isOverdue(nextInstallment.due_date, nextInstallment.status) ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <Calendar size={24} />
                    </div>
                    <div className="flex-1">
                        <p className={`font-semibold ${isOverdue(nextInstallment.due_date, nextInstallment.status) ? 'text-red-700' : 'text-yellow-700'}`}>
                            {isOverdue(nextInstallment.due_date, nextInstallment.status) ? t('customer.payment_overdue') : t('customer.next_payment')}
                        </p>
                        <p className="text-sm text-gray-600">
                            {formatDate(nextInstallment.due_date)} • ฿{Number(nextInstallment.amount).toLocaleString()}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('installments')} className={`px-4 py-2 font-medium transition ${activeTab === 'installments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Calendar size={16} className="inline mr-2" />{t('customer.installments')}
                </button>
                <button onClick={() => setActiveTab('payment')} className={`px-4 py-2 font-medium transition ${activeTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <QrCode size={16} className="inline mr-2" />{t('customer.pay_now')}
                </button>
                <button onClick={() => setActiveTab('info')} className={`px-4 py-2 font-medium transition ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    <FileText size={16} className="inline mr-2" />{t('customer.contract_info')}
                </button>
            </div>

            {/* Installments Tab */}
            {activeTab === 'installments' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('contract.due_date')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.amount')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('contract.receipt')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {contract.installments?.map((inst, idx) => (
                                <tr key={inst.id} className={inst.status === 'paid' ? 'bg-green-50' : isOverdue(inst.due_date, inst.status) ? 'bg-red-50' : ''}>
                                    <td className="px-4 py-3 text-sm">{idx + 1}</td>
                                    <td className="px-4 py-3 text-sm">{formatDate(inst.due_date)}</td>
                                    <td className="px-4 py-3 text-sm text-right">฿{Number(inst.amount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        {getStatusBadge(isOverdue(inst.due_date, inst.status) && inst.status !== 'paid' ? 'overdue' : inst.status)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {inst.receipt ? (
                                            <Link to={`/receipts/${inst.receipt.id}`} target="_blank" className="text-blue-600 hover:text-blue-800">
                                                <FileText size={18} className="mx-auto" />
                                            </Link>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Tab (QR Code + Upload) */}
            {activeTab === 'payment' && (
                <div className="space-y-6">
                    {/* QR Code Section */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{t('customer.scan_to_pay')}</h3>

                        {contract.owner?.payment_qr_code ? (
                            <div className="flex flex-col items-center">
                                <img
                                    src={`${window.location.origin}/storage/${contract.owner.payment_qr_code}`}
                                    alt="QR Code"
                                    className="w-48 h-48 object-contain border rounded-lg mb-4"
                                />
                                <div className="text-center bg-gray-50 p-4 rounded-lg w-full max-w-sm">
                                    <p className="text-sm text-gray-500">{t('settings.bank_name')}</p>
                                    <p className="font-semibold text-gray-800">{contract.owner.bank_name || '-'}</p>
                                    <p className="text-sm text-gray-500 mt-2">{t('settings.account_number')}</p>
                                    <p className="font-semibold text-gray-800 font-mono">{contract.owner.bank_account_number || '-'}</p>
                                    <p className="text-sm text-gray-500 mt-2">{t('settings.account_name')}</p>
                                    <p className="font-semibold text-gray-800">{contract.owner.bank_account_name || '-'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <QrCode size={64} className="mx-auto mb-4" />
                                <p>{t('customer.no_qr_available')}</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Payment Proof */}
                    {pendingInstallments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Upload size={20} className="text-blue-600" />
                                {t('payment.upload_proof')}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment.select_installment')}
                                    </label>
                                    <select
                                        value={selectedInstallment}
                                        onChange={(e) => setSelectedInstallment(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{t('payment.choose_installment')}</option>
                                        {pendingInstallments.map((inst, idx) => (
                                            <option key={inst.id} value={inst.id}>
                                                {t('payment.installment')} #{contract.installments.indexOf(inst) + 1} - {formatDate(inst.due_date)} - ฿{Number(inst.amount).toLocaleString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('payment.slip_image')}
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="proof-upload"
                                    />
                                    <label
                                        htmlFor="proof-upload"
                                        className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                                    >
                                        <Upload size={20} />
                                        {selectedFile ? selectedFile.name : t('payment.choose_file')}
                                    </label>
                                </div>

                                {previewUrl && (
                                    <div className="flex justify-center">
                                        <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg border" />
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmitProof}
                                    disabled={!selectedInstallment || !selectedFile || uploading}
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                                >
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            {t('payment.submit_proof')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Contract Info Tab */}
            {activeTab === 'info' && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.contract_number')}</p>
                            <p className="font-semibold">{contract.contract_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.type')}</p>
                            <p className="font-semibold">
                                {contract.contract_type === 'hire_purchase'
                                    ? t('contract.type_hire_purchase')
                                    : t('contract.type_installment')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.total_price')}</p>
                            <p className="font-semibold">฿{Number(contract.total_price || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.down_payment')}</p>
                            <p className="font-semibold">฿{Number(contract.down_payment || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.interest_rate')}</p>
                            <p className="font-semibold">{contract.interest_rate}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.installments')}</p>
                            <p className="font-semibold">{contract.installments_count} {t('contract.installments')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.start_date')}</p>
                            <p className="font-semibold">{formatDate(contract.start_date)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{t('contract.end_date')}</p>
                            <p className="font-semibold">{formatDate(contract.end_date)}</p>
                        </div>
                        {contract.balloon_payment > 0 && (
                            <div className="col-span-2 bg-amber-50 p-4 rounded-lg">
                                <p className="text-sm text-amber-600">{t('contract.balloon_payment')}</p>
                                <p className="font-bold text-amber-700 text-lg">฿{Number(contract.balloon_payment).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
