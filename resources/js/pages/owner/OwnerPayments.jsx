import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Eye, Image } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api';

export default function OwnerPayments() {
    const { t } = useTranslation();
    const [proofs, setProofs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchProofs();
    }, []);

    const fetchProofs = async () => {
        try {
            const res = await api.get('/owner/payments');
            setProofs(res.data);
        } catch (err) {
            console.error('Failed to fetch payment proofs:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return dateString.split('T')[0];
    };

    const handleApprove = async (id) => {
        const result = await Swal.fire({
            title: t('payment.confirm_approve'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            confirmButtonText: t('payment.approve'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/owner/payments/${id}/approve`);
                Swal.fire({
                    icon: 'success',
                    text: t('payment.approved_success'),
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchProofs();
            } catch (err) {
                Swal.fire({ icon: 'error', text: t('common.error') });
            }
        }
    };

    const handleReject = async (id) => {
        const { value: note } = await Swal.fire({
            title: t('payment.reject_reason'),
            input: 'textarea',
            inputPlaceholder: t('payment.reject_note_hint'),
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: t('payment.reject'),
            cancelButtonText: t('common.cancel')
        });

        if (note !== undefined) {
            try {
                await api.put(`/owner/payments/${id}/reject`, { note });
                Swal.fire({
                    icon: 'success',
                    text: t('payment.rejected_success'),
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchProofs();
            } catch (err) {
                Swal.fire({ icon: 'error', text: t('common.error') });
            }
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: t('payment.status_pending') },
            approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: t('payment.status_approved') },
            rejected: { color: 'bg-red-100 text-red-700', icon: XCircle, label: t('payment.status_rejected') },
        };
        const c = config[status] || config.pending;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${c.color}`}>
                <Icon size={12} />
                {c.label}
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

    const pendingProofs = proofs.filter(p => p.status === 'pending');
    const reviewedProofs = proofs.filter(p => p.status !== 'pending');

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('payment.title')}</h1>

            {/* Pending Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-500" />
                    {t('payment.pending_review')} ({pendingProofs.length})
                </h2>

                {pendingProofs.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 text-center text-gray-500 border">
                        {t('payment.no_pending')}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingProofs.map((proof) => (
                            <div key={proof.id} className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4">
                                <img
                                    src={proof.image_url}
                                    alt="Payment proof"
                                    className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                                    onClick={() => setSelectedImage(proof.image_url)}
                                />
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">
                                        {t('payment.installment')} #{proof.installment?.id} - {proof.installment?.contract?.contract_number}
                                    </p>
                                    <p className="text-sm text-gray-500">{proof.customer?.name}</p>
                                    <p className="text-xs text-gray-400">{t('payment.submitted')}: {formatDate(proof.submitted_at)}</p>
                                    {proof.note && <p className="text-sm text-gray-600 mt-1">{proof.note}</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(proof.id)}
                                        className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                    >
                                        <CheckCircle size={18} />
                                        {t('payment.approve')}
                                    </button>
                                    <button
                                        onClick={() => handleReject(proof.id)}
                                        className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                    >
                                        <XCircle size={18} />
                                        {t('payment.reject')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Section */}
            <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    {t('payment.history')} ({reviewedProofs.length})
                </h2>

                {reviewedProofs.length === 0 ? (
                    <div className="bg-white rounded-xl p-6 text-center text-gray-500 border">
                        {t('payment.no_history')}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('payment.proof')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('payment.customer')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('payment.contract')}</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('payment.reviewed_at')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {reviewedProofs.map((proof) => (
                                    <tr key={proof.id}>
                                        <td className="px-4 py-3">
                                            <img
                                                src={proof.image_url}
                                                alt="Payment proof"
                                                className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                                                onClick={() => setSelectedImage(proof.image_url)}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">{proof.customer?.name}</td>
                                        <td className="px-4 py-3 text-sm">{proof.installment?.contract?.contract_number}</td>
                                        <td className="px-4 py-3 text-center">{getStatusBadge(proof.status)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(proof.reviewed_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Payment proof"
                        className="max-w-full max-h-full rounded-lg shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
