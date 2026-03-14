import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText, Calendar, CreditCard, CheckCircle, Clock, AlertCircle, Printer, XCircle, RotateCw, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api';
import { compressImage } from '../../utils/imageCompression';
import SignedPDFModal from '../../components/SignedPDFModal';
import RenewalModal from '../../components/RenewalModal';

export default function ContractDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    const [showSignModal, setShowSignModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showRenewalModal, setShowRenewalModal] = useState(false);

    // Fine Modal State
    const [showFineModal, setShowFineModal] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState(null);
    const [fineAmount, setFineAmount] = useState('');
    const [fineNote, setFineNote] = useState('');

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const response = await api.get(`/contracts/${id}`);
            setContract(response.data);
        } catch (err) {
            console.error('Failed to fetch contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPdfUrl = async () => {
        try {
            const response = await api.get(`/contracts/${id}/pdf-url`);
            setPdfUrl(response.data.url);
        } catch (err) {
            console.error('Failed to get PDF URL:', err);
        }
    };

    const handleSignClick = () => {
        fetchPdfUrl();
        setShowSignModal(true);
    };

    const handleSignSave = async (data, type) => {
        try {
            // Check if data is object (new format) or string (old format)
            const signature = typeof data === 'object' ? data.signature : data;
            const name = typeof data === 'object' ? data.name : null;

            await api.post(`/contracts/${id}/sign`, {
                signature: signature,
                type: type,
                witness_name: name
            });
            fetchPdfUrl();
            fetchContract();
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: 'Signature saved successfully',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Failed to save signature:', err);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: 'Failed to save signature'
            });
        }
    };

    const handleCancelClick = () => {
        setShowCancelModal(true);
    };

    const handleCancelSubmit = async (e) => {
        e.preventDefault();
        if (!cancelReason.trim()) return;

        const result = await Swal.fire({
            title: t('contract.confirm_cancel'),
            text: t('contract.cancel_description'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel')
        });

        if (!result.isConfirmed) return;

        try {
            await api.post(`/contracts/${id}/cancel`, { reason: cancelReason });
            setShowCancelModal(false);
            fetchContract(); // Refresh data to show cancelled status
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('contract.cancel_success'),
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Failed to cancel contract:', err);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: err.response?.data?.message || 'Failed to cancel contract'
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return dateString.split('T')[0];
    };

    const handlePrint = () => {
        window.open(`/owner/contracts/${id}/print`, '_blank');
    };

    const handleFineClick = (installment) => {
        setSelectedInstallment(installment);
        setFineAmount(installment.fine_amount || '');
        setFineNote(installment.fine_note || '');
        setShowFineModal(true);
    };

    const handleFineSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/installments/${selectedInstallment.id}`, {
                fine_amount: fineAmount,
                fine_note: fineNote
            });
            setShowFineModal(false);
            fetchContract();
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Failed to update fine:', err);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: 'Failed to update fine'
            });
        }
    };

    const handleActivate = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันการเริ่มสัญญา (Activate Contract)',
            text: 'เมื่อเริ่มสัญญาแล้ว สถานะจะเปลี่ยนเป็น Active และไม่สามารถแก้ไขได้อีก (Once activated, status becomes Active and cannot be edited)',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน (Confirm)',
            cancelButtonText: 'ยกเลิก (Cancel)'
        });

        if (!result.isConfirmed) return;

        try {
            await api.post(`/contracts/${id}/activate`);
            fetchContract();
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: 'Contract activated successfully',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Failed to activate contract:', err);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: err.response?.data?.message || 'Failed to activate contract'
            });
        }
    };

    const getStatusBadge = (status, dueDate) => {
        // Check for overdue if status is pending
        let displayStatus = status;
        if (status === 'pending' && dueDate && new Date(dueDate) < new Date()) {
            displayStatus = 'overdue';
        }

        const statusConfig = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
            pending_verification: { color: 'bg-blue-100 text-blue-800', icon: Clock },
            paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
            partial: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
            cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
        };
        const config = statusConfig[displayStatus] || statusConfig.pending;
        const Icon = config.icon;
        return (
            <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full ${config.color}`}>
                <Icon size={12} />
                {t(`contract.status_${displayStatus}`) || displayStatus}
            </span>
        );
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
                <Link to="/owner/contracts" className="text-blue-600 hover:underline mt-2 inline-block">
                    {t('contract.back_to_list')}
                </Link>
            </div>
        );
    }

    const tabs = [
        { id: 'info', label: t('contract.tab_info'), icon: FileText },
        ...(contract?.contract_type !== 'rental' ? [{ id: 'installments', label: t('contract.tab_installments'), icon: Calendar }] : []),
        { id: 'payments', label: t('contract.tab_payments'), icon: CreditCard },
        { id: 'documents', label: t('contract.tab_documents') || 'เอกสาร (Documents)', icon: FileText },
    ];

    const paidCount = contract.installments?.filter(i => i.status === 'paid').length || 0;
    const totalCount = contract.installments?.length || 0;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return (
        <div className="pb-10 relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/owner/contracts" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {contract.contract_number} {contract.asset?.name ? <span className="text-lg font-normal text-gray-600">({contract.asset.name})</span> : ''}
                    </h2>
                    <p className="text-gray-500">{contract.customer?.name}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {(contract.status === 'pending' || contract.status === 'pending_signature') && (
                        <button
                            onClick={handleActivate}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow transition"
                        >
                            <CheckCircle size={18} />
                            <span>เริ่มสัญญา (Activate)</span>
                        </button>
                    )}

                    {contract.status === 'active' && (
                        <button
                            onClick={() => setShowRenewalModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition"
                        >
                            <RotateCw size={18} />
                            <span>{t('contract.renew_contract')}</span>
                        </button>
                    )}
                    {contract.status === 'active' && (
                        <button
                            onClick={handleCancelClick}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition"
                        >
                            <XCircle size={18} />
                            {t('contract.cancel')}
                        </button>
                    )}
                    {contract.status === 'active' ? (
                        <button
                            onClick={handleSignClick}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
                        >
                            <Printer size={18} />
                            พิมพ์สัญญา (Print Contract)
                        </button>
                    ) : (
                        <button
                            onClick={handleSignClick}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
                        >
                            <FileText size={18} />
                            ลงนาม (Sign)
                        </button>
                    )}
                    {getStatusBadge(contract.status)}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                        {contract.contract_type === 'rental' ? t('contract.rental_progress') : t('contract.payment_progress')}
                    </span>
                    <span className="font-medium">
                        {paidCount} / {totalCount} {contract.contract_type === 'rental' ? t('contract.months') : t('contract.installments_paid')}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${activeTab === tab.id
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.contract_info')}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">{t('contract.contract_number')}</span>
                                        <p className="font-medium">{contract.contract_number}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.contract_type')}</span>
                                        <p className="font-medium">{t(`contract.type_${contract.contract_type}`) || contract.contract_type}</p>
                                    </div>
                                    {contract.witness1_name && (
                                        <div>
                                            <span className="text-gray-500">พยาน 1 (Witness 1)</span>
                                            <p className="font-medium">{contract.witness1_name}</p>
                                        </div>
                                    )}
                                    {contract.witness2_name && (
                                        <div>
                                            <span className="text-gray-500">พยาน 2 (Witness 2)</span>
                                            <p className="font-medium">{contract.witness2_name}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-500">{t('contract.start_date')}</span>
                                        <p className="font-medium">{contract.start_date}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{t('contract.end_date')}</span>
                                        <p className="font-medium">{contract.end_date || '-'}</p>
                                    </div>
                                    {contract.contract_type === 'rental' && (
                                        <div>
                                            <span className="text-gray-500">{t('contract.contract_duration')}</span>
                                            <p className="font-medium">{contract.installments_count} {t('contract.months')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ... (rest of info tab) ... */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.financial_info')}</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {/* ... existing financial info ... */}
                                    <div>
                                        <span className="text-gray-500">{contract.contract_type === 'rental' ? t('contract.monthly_rent_label') : t('contract.total_price')}</span>
                                        <p className="font-medium text-lg">฿{Number(contract.total_price).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">{contract.contract_type === 'rental' ? t('contract.security_deposit') : t('contract.down_payment')}</span>
                                        <p className="font-medium">฿{Number(contract.down_payment).toLocaleString()}</p>
                                    </div>
                                    {contract.contract_type !== 'rental' && (
                                        <>
                                            <div>
                                                <span className="text-gray-500">{t('contract.principal')}</span>
                                                <p className="font-medium">฿{Number(contract.principal_amount).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">{t('contract.interest_rate')}</span>
                                                <p className="font-medium">{contract.interest_rate}%</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">{t('contract.monthly_pay')}</span>
                                                <p className="font-medium text-blue-600">฿{Number(contract.installment_amount).toLocaleString()}</p>
                                            </div>
                                        </>
                                    )}
                                    {contract.balloon_payment > 0 && (
                                        <div>
                                            <span className="text-gray-500">{t('contract.balloon_payment')}</span>
                                            <p className="font-medium text-amber-600">฿{Number(contract.balloon_payment).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.customer_info')}</h3>
                                <div className="text-sm space-y-2">
                                    <p><span className="text-gray-500">{t('common.name')}:</span> {contract.customer?.name}</p>
                                    <p><span className="text-gray-500">{t('common.phone')}:</span> {contract.customer?.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800 border-b pb-2">{t('contract.asset_info')}</h3>
                                <div className="text-sm space-y-2">
                                    <p><span className="text-gray-500">{t('common.name')}:</span> {contract.asset?.name}</p>
                                    <p><span className="text-gray-500">{t('asset.type')}:</span> {contract.asset?.type || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Installments Tab */}
                    {activeTab === 'installments' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('contract.due_date')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.amount')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.paid_amount')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('contract.fine')}</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contract.installments?.map((inst, idx) => (
                                        <tr key={inst.id} className={inst.status === 'overdue' ? 'bg-red-50' : ''}>
                                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                                            <td className="px-4 py-3 text-sm">{formatDate(inst.due_date)}</td>
                                            <td className="px-4 py-3 text-sm text-right">฿{Number(inst.amount).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right">฿{Number(inst.paid_amount || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600">
                                                {inst.fine_amount > 0 ? `+฿${Number(inst.fine_amount).toLocaleString()}` : '-'}
                                                {inst.fine_note && <div className="text-xs text-gray-500">{inst.fine_note}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-center">{getStatusBadge(inst.status, inst.due_date)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleFineClick(inst)}
                                                    className="text-gray-500 hover:text-blue-600"
                                                    title="Edit Fine"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!contract.installments || contract.installments.length === 0) && (
                                <p className="text-center text-gray-500 py-8">{t('contract.no_installments')}</p>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div>
                            {contract.receipts && contract.receipts.length > 0 ? (
                                <div className="space-y-4">
                                    {contract.receipts.map(receipt => (
                                        <div key={receipt.id} className="border rounded-lg p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{t('contract.receipt')} #{receipt.receipt_number}</p>
                                                <p className="text-sm text-gray-500">{receipt.paid_at}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-green-600">฿{Number(receipt.amount).toLocaleString()}</p>
                                                <p className="text-sm text-gray-500">{receipt.payment_method}</p>
                                                <Link to={`/receipts/${receipt.encrypted_id}`} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 block">
                                                    {t('contract.receipt')}
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">{t('contract.no_payments')}</p>
                            )}
                        </div>
                    )}

                    {/* Documents Tab */}
                    {activeTab === 'documents' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">เอกสารสัญญา (Contract Documents)</h3>
                                {contract.documents && contract.documents.length > 0 ? (
                                    <div className="space-y-3">
                                        {contract.documents.map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded ${doc.type === 'main_contract' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{doc.original_name}</p>
                                                        <span className="text-xs text-gray-500 uppercase">{doc.type.replace('_', ' ')} • {new Date(doc.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`/storage/${doc.file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        View
                                                    </a>
                                                    {(contract.status === 'pending' || contract.status === 'pending_signature') && (
                                                        <button
                                                            onClick={async () => {
                                                                const result = await Swal.fire({
                                                                    title: 'Are you sure?',
                                                                    text: "You won't be able to revert this!",
                                                                    icon: 'warning',
                                                                    showCancelButton: true,
                                                                    confirmButtonColor: '#d33',
                                                                    cancelButtonColor: '#3085d6',
                                                                    confirmButtonText: 'Yes, delete it!'
                                                                });

                                                                if (result.isConfirmed) {
                                                                    try {
                                                                        await api.delete(`/contracts/${id}/documents/${doc.id}`);
                                                                        fetchContract();
                                                                        Swal.fire('Deleted!', 'Document has been deleted.', 'success');
                                                                    } catch (err) {
                                                                        Swal.fire('Error', 'Failed to delete document', 'error');
                                                                    }
                                                                }
                                                            }}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No documents uploaded.</p>
                                )}
                            </div>

                            {(contract.status === 'pending' || contract.status === 'pending_signature') && (
                                <div className="mt-8 border-t pt-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">อัพโหลดเอกสารเพิ่มเติม (Upload New Document)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    let fileToUpload = file;
                                                    if (file.type.startsWith('image/')) {
                                                        if (file.size > 1024 * 1024) {
                                                            Swal.fire({
                                                                title: t('common.loading') || 'Processing...',
                                                                text: 'Compressing image...',
                                                                allowOutsideClick: false,
                                                                didOpen: () => Swal.showLoading()
                                                            });
                                                        }
                                                        fileToUpload = await compressImage(file, 1);
                                                        if (file.size > 1024 * 1024) Swal.close();
                                                    }

                                                    const formData = new FormData();
                                                    formData.append('file', fileToUpload);
                                                    formData.append('type', 'main_contract');

                                                    try {
                                                        await api.post(`/contracts/${id}/documents`, formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        fetchContract();
                                                        Swal.fire({ icon: 'success', title: 'Uploaded!', timer: 1500, showConfirmButton: false });
                                                    } catch (err) {
                                                        Swal.fire('Error', 'Failed to upload document', 'error');
                                                    }
                                                }}
                                            />
                                            <FileText size={32} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-700">Upload Main Contract (PDF)</span>
                                            <span className="text-xs text-gray-500 mt-1">Replaces existing main contract</span>
                                        </div>

                                        <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    let fileToUpload = file;
                                                    if (file.type.startsWith('image/')) {
                                                        if (file.size > 1024 * 1024) {
                                                            Swal.fire({
                                                                title: t('common.loading') || 'Processing...',
                                                                text: 'Compressing image...',
                                                                allowOutsideClick: false,
                                                                didOpen: () => Swal.showLoading()
                                                            });
                                                        }
                                                        fileToUpload = await compressImage(file, 1);
                                                        if (file.size > 1024 * 1024) Swal.close();
                                                    }

                                                    const formData = new FormData();
                                                    formData.append('file', fileToUpload);
                                                    formData.append('type', 'attachment');

                                                    try {
                                                        await api.post(`/contracts/${id}/documents`, formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        fetchContract();
                                                        Swal.fire({ icon: 'success', title: 'Uploaded!', timer: 1500, showConfirmButton: false });
                                                    } catch (err) {
                                                        Swal.fire('Error', 'Failed to upload document', 'error');
                                                    }
                                                }}
                                            />
                                            <FileText size={32} className="text-gray-400 mb-2" />
                                            <span className="text-sm font-medium text-gray-700">Upload Attachment</span>
                                            <span className="text-xs text-gray-500 mt-1">PDF or Image</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Signed PDF Modal */}
            {showSignModal && (
                <SignedPDFModal
                    pdfUrl={pdfUrl}
                    onSaveSignature={handleSignSave}
                    onClose={() => setShowSignModal(false)}
                    signatures={{
                        owner: !!contract.owner_signature_path,
                        customer: !!contract.customer_signature_path,
                        witness1: !!contract.witness1_signature_path,
                        witness2: !!contract.witness2_signature_path
                    }}
                    canEdit={contract.status === 'pending' || contract.status === 'pending_signature'}
                />
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">{t('contract.cancel_title')}</h3>
                                <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleCancelSubmit}>
                            <div className="p-6">
                                <p className="text-gray-600 mb-4">{t('contract.cancel_description')}</p>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        {t('contract.cancel_reason')} <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        rows="4"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder={t('contract.cancel_reason_placeholder')}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowCancelModal(false)}
                                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 transition"
                                >
                                    {t('common.close')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                                >
                                    {t('contract.confirm_cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Cancel Modal */}
            {/* ... */}

            {/* Fine Modal */}
            {showFineModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">Edit Fine</h3>
                                <button onClick={() => setShowFineModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleFineSubmit}>
                            <div className="p-6">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Fine Amount (Baht)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={fineAmount}
                                        onChange={(e) => setFineAmount(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Note (Optional)
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        value={fineNote}
                                        onChange={(e) => setFineNote(e.target.value)}
                                        placeholder="Reason for fine..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                                <button
                                    type="button"
                                    onClick={() => setShowFineModal(false)}
                                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 transition"
                                >
                                    {t('common.close')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Renewal Modal */}
            <RenewalModal
                isOpen={showRenewalModal}
                onClose={() => setShowRenewalModal(false)}
                contract={contract}
                onSuccess={() => {
                    fetchContract();
                }}
            />
        </div>
    );
}
