import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Upload, Trash2, CreditCard, Save, QrCode } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api';

export default function OwnerSettings() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [settings, setSettings] = useState({
        payment_qr_code: null,
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/owner/settings');
            setSettings(res.data);
            setPreviewUrl(res.data.payment_qr_code);
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadQr = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('qr_code', selectedFile);

        try {
            const res = await api.post('/owner/qrcode', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings({ ...settings, payment_qr_code: res.data.qr_code_url });
            setPreviewUrl(res.data.qr_code_url);
            setSelectedFile(null);
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('settings.qr_uploaded'),
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: t('settings.qr_upload_failed')
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteQr = async () => {
        const result = await Swal.fire({
            title: t('settings.confirm_delete_qr'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: t('common.delete'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            try {
                await api.delete('/owner/qrcode');
                setSettings({ ...settings, payment_qr_code: null });
                setPreviewUrl(null);
                Swal.fire({
                    icon: 'success',
                    text: t('settings.qr_deleted'),
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: t('common.error'),
                    text: t('settings.delete_failed')
                });
            }
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/owner/settings', {
                bank_name: settings.bank_name,
                bank_account_number: settings.bank_account_number,
                bank_account_name: settings.bank_account_name,
            });
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('settings.saved'),
                timer: 1500,
                showConfirmButton: false
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: t('settings.save_failed')
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Settings size={28} className="text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-800">{t('settings.owner_title')}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Code Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <QrCode size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold">{t('settings.payment_qr')}</h2>
                    </div>

                    <div className="space-y-4">
                        {/* QR Preview */}
                        <div className="flex justify-center">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="QR Code"
                                        className="w-48 h-48 object-contain border rounded-lg"
                                    />
                                    <button
                                        onClick={handleDeleteQr}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <QrCode size={48} className="mx-auto mb-2" />
                                        <p className="text-sm">{t('settings.no_qr')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Upload */}
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="qr-upload"
                            />
                            <label
                                htmlFor="qr-upload"
                                className="flex items-center justify-center gap-2 w-full py-2 px-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                            >
                                <Upload size={18} />
                                {t('settings.choose_file')}
                            </label>

                            {selectedFile && (
                                <button
                                    onClick={handleUploadQr}
                                    disabled={uploading}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            {t('settings.upload_qr')}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bank Info Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={20} className="text-green-600" />
                        <h2 className="text-lg font-semibold">{t('settings.bank_info')}</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('settings.bank_name')}
                            </label>
                            <select
                                name="bank_name"
                                value={settings.bank_name || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('settings.select_bank')}</option>
                                <option value="กสิกรไทย">ธนาคารกสิกรไทย</option>
                                <option value="กรุงเทพ">ธนาคารกรุงเทพ</option>
                                <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                                <option value="กรุงไทย">ธนาคารกรุงไทย</option>
                                <option value="กรุงศรี">ธนาคารกรุงศรี</option>
                                <option value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                                <option value="ออมสิน">ธนาคารออมสิน</option>
                                <option value="PromptPay">PromptPay</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('settings.account_number')}
                            </label>
                            <input
                                type="text"
                                name="bank_account_number"
                                value={settings.bank_account_number || ''}
                                onChange={handleChange}
                                placeholder="xxx-xxx-xxxx"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('settings.account_name')}
                            </label>
                            <input
                                type="text"
                                name="bank_account_name"
                                value={settings.bank_account_name || ''}
                                onChange={handleChange}
                                placeholder={t('settings.account_name_hint')}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {t('common.save')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
