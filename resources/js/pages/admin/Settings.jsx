import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [currentSetting, setCurrentSetting] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setSettings(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setLoading(false);
        }
    };

    const handleEdit = (setting) => {
        setCurrentSetting(setting);
        setEditValue(setting.value || '');
        setMessage(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentSetting(null);
        setEditValue('');
        setMessage(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // API expects an array of settings to update
            await api.put('/settings', {
                settings: [
                    { key: currentSetting.key, value: editValue }
                ]
            });

            setMessage({ type: 'success', text: 'บันทึกข้อมูลเรียบร้อยแล้ว' });
            fetchSettings(); // Refresh data
            handleCloseModal();
        } catch (error) {
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    // Group settings for display if needed, or just flat list. 
    // The user asked for "Table", so a single table with Group column or grouped tables is good.
    // Let's do grouped tables for better organization.
    const groupedSettings = settings.reduce((acc, setting) => {
        const group = setting.group || 'general';
        if (!acc[group]) acc[group] = [];
        acc[group].push(setting);
        return acc;
    }, {});

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">ตั้งค่าระบบ (Settings)</h1>

            {message && (
                <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                <div key={group} className="bg-white shadow rounded-lg overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-medium text-gray-900 capitalize">
                            {group === 'document' ? 'ตั้งค่าเอกสาร (Document Settings)' :
                                group === 'finance' ? 'ตั้งค่าการเงิน (Financial Settings)' :
                                    `${group} Settings`}
                        </h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">รายการ (Setting)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าปัจจุบัน (Value)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">จัดการ (Action)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {groupSettings.map((setting) => (
                                <tr key={setting.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {setting.label}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {setting.value}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(setting)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                        >
                                            แก้ไข
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* Modal */}
            {showModal && currentSetting && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">แก้ไข : {currentSetting.label}</h2>
                        <form onSubmit={handleSave}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ค่าที่ต้องการระบุ
                                </label>
                                <input
                                    type={currentSetting.type === 'number' ? 'number' : 'text'}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Internal Key: <code className="bg-gray-100 px-1 rounded">{currentSetting.key}</code>
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                    disabled={saving}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={saving}
                                >
                                    {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
