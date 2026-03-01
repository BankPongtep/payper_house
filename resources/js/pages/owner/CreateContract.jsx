import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import Swal from 'sweetalert2';

export default function CreateContract() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [assets, setAssets] = useState([]);

    const [mainContract, setMainContract] = useState(null);
    const [attachments, setAttachments] = useState([]);

    const [formData, setFormData] = useState({
        customer_id: '',
        asset_id: '',
        contract_number: `CNT-${Date.now()}`, // Temporary default
        contract_type: 'installment', // installment | hire_purchase
        total_price: '',
        down_payment: '0',
        interest_rate: '0',
        installments_count: '12',
        balloon_percent: '0', // % of principal for balloon
        start_date: new Date().toISOString().split('T')[0],
        witness1_name: '',
        witness2_name: '',
    });

    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [custRes, assetRes, userRes] = await Promise.all([
                    api.get('/customers'),
                    api.get('/assets'),
                    api.get('/user') // Fetch the current owner's profile to get default interest_rate
                ]);
                setCustomers(custRes.data);
                setAssets(assetRes.data.filter(a => a.status === 'available'));

                // If the user has a specific interest_rate set, populate it
                if (userRes.data && userRes.data.interest_rate !== null) {
                    setFormData(prev => ({ ...prev, interest_rate: userRes.data.interest_rate }));
                }
            } catch (error) {
                console.error("Failed to fetch dependencies", error);
            }
        };
        fetchDependencies();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setPreview(null); // Reset preview on change
    };

    const handleFileChange = (e) => {
        if (e.target.name === 'main_contract') {
            setMainContract(e.target.files[0]);
        } else if (e.target.name === 'attachments') {
            setAttachments(e.target.files);
        }
    };

    const handleAssetChange = (e) => {
        const selectedAssetId = e.target.value;
        const selectedAsset = assets.find(a => a.id == selectedAssetId);
        setFormData({
            ...formData,
            asset_id: selectedAssetId,
            total_price: selectedAsset ? selectedAsset.price : ''
        });
        setPreview(null);
    };

    const handleCalculate = async () => {
        try {
            const response = await api.post('/contracts/preview', {
                total_price: formData.total_price,
                down_payment: formData.down_payment,
                interest_rate: formData.interest_rate,
                installments_count: formData.installments_count,
                start_date: formData.start_date,
                contract_type: formData.contract_type,
                balloon_percent: formData.contract_type === 'hire_purchase' ? formData.balloon_percent : 0,
            });
            setPreview(response.data);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: t('contract.failed_preview')
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!preview && formData.contract_type !== 'rental' && !mainContract) {
            // If manual PDF upload, calculation might not be needed, but strictly for system generated ones it is.
            // For now, let's keep it required if not rental and no external PDF ? 
            // Actually, strict check:
            if (!preview && !mainContract && formData.contract_type !== 'rental') {
                Swal.fire({
                    icon: 'warning',
                    title: t('common.error'),
                    text: t('contract.calculate_first')
                });
                return;
            }
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        // Append calculated balloon_percent if needed, though it's in formData now
        if (formData.contract_type !== 'hire_purchase') {
            data.set('balloon_percent', 0);
        }

        if (mainContract) {
            data.append('main_contract', mainContract);
        }

        if (attachments && attachments.length > 0) {
            Array.from(attachments).forEach(file => {
                data.append('attachments[]', file);
            });
        }

        try {
            await api.post('/contracts', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('contract.created_success'),
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                navigate('/owner/contracts');
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: t('contract.failed_create')
            });
        }
    };

    return (
        <div className="pb-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('contract.create_title')}</h2>

            <div className={`grid grid-cols-1 ${formData.contract_type === 'rental' ? '' : 'lg:grid-cols-2'} gap-8`}>
                {/* Form Section */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('contract.select_customer')}</label>
                                <select name="customer_id" className="w-full border rounded p-2" onChange={handleChange} required>
                                    <option value="">{t('contract.select_customer_placeholder')}</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('contract.select_asset')}</label>
                                <select name="asset_id" className="w-full border rounded p-2" value={formData.asset_id} onChange={handleAssetChange} required>
                                    <option value="">{t('contract.select_asset_placeholder')}</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({Number(a.price).toLocaleString()}฿)</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">{t('contract.contract_type')}</label>
                            <div className="flex gap-6">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="contract_type"
                                        value="installment"
                                        checked={formData.contract_type === 'installment'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    {t('contract.type_installment')}
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="contract_type"
                                        value="hire_purchase"
                                        checked={formData.contract_type === 'hire_purchase'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    {t('contract.type_hire_purchase')}
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="contract_type"
                                        value="rental"
                                        checked={formData.contract_type === 'rental'}
                                        onChange={handleChange}
                                        className="mr-2"
                                    />
                                    {t('contract.type_rental')}
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">{t('contract.contract_number')}</label>
                            <input name="contract_number" className="w-full border rounded p-2" value={formData.contract_number} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {formData.contract_type === 'rental' ? t('contract.monthly_rent_label') : t('contract.total_price')}
                                </label>
                                <input
                                    name="total_price"
                                    type="text"
                                    className="w-full border rounded p-2 text-right"
                                    value={formData.total_price ? Number(formData.total_price).toLocaleString() : ''}
                                    onChange={e => {
                                        const rawValue = e.target.value.replace(/,/g, '');
                                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                            setFormData({ ...formData, total_price: rawValue });
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {formData.contract_type === 'rental' ? t('contract.security_deposit') : t('contract.down_payment')}
                                </label>
                                <input
                                    name="down_payment"
                                    type="text"
                                    className="w-full border rounded p-2 text-right"
                                    value={formData.down_payment ? Number(formData.down_payment).toLocaleString() : ''}
                                    onChange={e => {
                                        const rawValue = e.target.value.replace(/,/g, '');
                                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                            setFormData({ ...formData, down_payment: rawValue });
                                        }
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {formData.contract_type !== 'rental' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('contract.interest_rate')}</label>
                                    <input
                                        name="interest_rate"
                                        type="text"
                                        step="0.01"
                                        className="w-full border rounded p-2 text-right"
                                        value={formData.interest_rate}
                                        onChange={e => {
                                            const rawValue = e.target.value.replace(/,/g, '');
                                            if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                                setFormData({ ...formData, interest_rate: rawValue });
                                            }
                                        }}
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {formData.contract_type === 'rental' ? t('contract.contract_duration') : t('contract.installments')}
                                </label>
                                <input name="installments_count" type="number" className="w-full border rounded p-2 text-right" value={formData.installments_count} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('contract.start_date')}</label>
                                <input name="start_date" type="date" className="w-full border rounded p-2" value={formData.start_date} onChange={handleChange} required />
                            </div>
                        </div>

                        {formData.contract_type === 'hire_purchase' && (
                            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <label className="block text-sm font-medium mb-2 text-blue-700">{t('contract.balloon_percent')}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        name="balloon_percent"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="5"
                                        className="w-24 border rounded p-2 text-right"
                                        value={formData.balloon_percent}
                                        onChange={handleChange}
                                    />
                                    <span className="text-gray-600">% {t('contract.of_principal')}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{t('contract.balloon_hint')}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">ข้อมูลพยาน (Witnesses)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">พยานคนที่ 1 (Witness 1)</label>
                                    <input name="witness1_name" className="w-full border rounded p-2" value={formData.witness1_name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">พยานคนที่ 2 (Witness 2)</label>
                                    <input name="witness2_name" className="w-full border rounded p-2" value={formData.witness2_name} onChange={handleChange} placeholder="ชื่อ-นามสกุล" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-800 border-b pb-2 mb-4">เอกสารสัญญา (Documents)</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    ไฟล์สัญญาหลัก (Main Contract PDF) <span className="text-red-500 text-xs">* ถ้ามีไฟล์นี้ ระบบจะใช้ไฟล์นี้แทนการสร้างอัตโนมัติ (If uploaded, this PDF will replace the generated one)</span>
                                </label>
                                <input
                                    type="file"
                                    name="main_contract"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="w-full border rounded p-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    รองรับเฉพาะไฟล์ PDF เท่านั้น (Only PDF files are allowed). ระบบจะต่อท้ายด้วยตารางผ่อนชำระและลายเซ็นอัตโนมัติ
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    เอกสารแนบอื่นๆ (Attachments)
                                </label>
                                <input
                                    type="file"
                                    name="attachments"
                                    multiple
                                    accept="application/pdf,image/*"
                                    onChange={handleFileChange}
                                    className="w-full border rounded p-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    สามารถเลือกได้หลายไฟล์ รองรับ PDF และรูปภาพ (Multiple files allowed: PDF, JPG, PNG)
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between mt-6">
                            {formData.contract_type !== 'rental' && (
                                <button type="button" onClick={handleCalculate} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                                    {t('contract.calculate')}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={!preview && formData.contract_type !== 'rental'}
                                className={`px-6 py-2 rounded text-white ${(preview || formData.contract_type === 'rental') ? 'bg-blue-600 hover:shadow' : 'bg-blue-300 cursor-not-allowed'
                                    } ${formData.contract_type === 'rental' ? 'w-full' : ''}`}
                            >
                                {t('contract.create')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Section */}
                {formData.contract_type !== 'rental' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2">{t('contract.schedule_preview')}</h3>
                        {preview ? (
                            <div>
                                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                    <div><span className="text-gray-500">{t('contract.principal')}:</span> ฿{Number(preview.principal).toLocaleString()}</div>
                                    <div><span className="text-gray-500">{t('contract.total_interest')}:</span> ฿{Number(preview.interest_total).toLocaleString()}</div>
                                    <div className="font-bold text-blue-600"><span className="text-gray-500 font-normal">{t('contract.monthly_pay')}:</span> ฿{Number(preview.installment_amount).toLocaleString()}</div>
                                    <div className="font-bold"><span className="text-gray-500 font-normal">{t('contract.total_payable')}:</span> ฿{Number(preview.total_payable).toLocaleString()}</div>
                                </div>

                                {preview.balloon_payment > 0 && (
                                    <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-700 font-medium">🏦 {t('contract.balloon_payment')}</span>
                                            <span className="text-xl font-bold text-amber-700">฿{Number(preview.balloon_payment).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-amber-600 mt-1">{t('contract.balloon_desc')}</p>
                                    </div>
                                )}

                                <div className="overflow-y-auto max-h-[400px]">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">#</th>
                                                <th className="px-4 py-2 text-left">{t('contract.due_date')}</th>
                                                <th className="px-4 py-2 text-right">{t('contract.amount')}</th>
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
                                {t('contract.preview_hint')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
