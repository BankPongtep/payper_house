import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

export default function Customers() {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);

    // ... (rest of state)

    // Helper to get localized name
    const getName = (item) => {
        if (!item) return '';
        if (i18n.language === 'en' && item.name_en) {
            return item.name_en;
        }
        return item.name_th;
    };

    // ...


    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit, password
    const [currentUser, setCurrentUser] = useState(null);

    // Dropdown state
    const [activeMenuId, setActiveMenuId] = useState(null);
    const menuRef = useRef(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        id_card_number: '',
        role: 'customer', // Locked to customer
        password: '',
        password_confirmation: '',
        // Address Fields
        address_house_no: '',
        address_village: '',
        address_floor: '',
        address_moo: '',
        address_soi: '',
        address_road: '',
        address_sub_district: '',
        address_district: '',
        address_province: '',
        address_postal_code: '',
    });

    const fetchUsers = async () => {
        try {
            // GET /users for Owner returns their customers
            const response = await api.get('/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch customers');
            setLoading(false);
        }
    };

    // Address Data
    const [provinces, setProvinces] = useState([]);
    const [amphures, setAmphures] = useState([]);
    const [tambons, setTambons] = useState([]);

    const fetchProvinces = async () => {
        try {
            const response = await api.get('/thai-address/provinces');
            setProvinces(response.data);
        } catch (error) {
            console.error('Error fetching provinces:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchProvinces();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const resetForm = () => {
        setFormData({
            name: '',
            username: '',
            email: '',
            phone: '',
            id_card_number: '',
            role: 'customer',
            password: '',
            password_confirmation: '',
            address_house_no: '',
            address_village: '',
            address_floor: '',
            address_moo: '',
            address_soi: '',
            address_road: '',
            address_sub_district: '',
            address_district: '',
            address_province: '',
            address_postal_code: '',
        });
        setAmphures([]);
        setTambons([]);
        setError(null);
    };

    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentUser(null);
        resetForm();
        setShowModal(true);
        setActiveMenuId(null);
    };

    const handleOpenEdit = async (user) => {
        setModalMode('edit');
        setCurrentUser(user);
        // Map user data to form
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            id_card_number: user.id_card_number || '',
            role: 'customer',
            password: '',
            password_confirmation: '',
            // Address mapping
            address_house_no: user.address_house_no || '',
            address_village: user.address_village || '',
            address_floor: user.address_floor || '',
            address_moo: user.address_moo || '',
            address_soi: user.address_soi || '',
            address_road: user.address_road || '',
            address_sub_district: user.address_sub_district || '',
            address_district: user.address_district || '',
            address_province: user.address_province || '',
            address_postal_code: user.address_postal_code || '',
        });

        // Pre-load cascading data if address exists
        if (user.address_province) {
            const prov = provinces.find(p => p.name_th === user.address_province);
            if (prov) {
                try {
                    const ampRes = await api.get(`/thai-address/amphures/${prov.id}`);
                    setAmphures(ampRes.data);

                    if (user.address_district) {
                        const amp = ampRes.data.find(a => a.name_th === user.address_district);
                        if (amp) {
                            const tamRes = await api.get(`/thai-address/tambons/${amp.id}`);
                            setTambons(tamRes.data);
                        }
                    }
                } catch (e) {
                    console.error("Error loading address data", e);
                }
            }
        }

        setShowModal(true);
        setActiveMenuId(null);
    };

    const handleOpenPassword = (user) => {
        setModalMode('password');
        setCurrentUser(user);
        resetForm();
        setShowModal(true);
        setActiveMenuId(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleProvinceChange = async (e) => {
        const provinceId = e.target.value;
        const prov = provinces.find(p => p.id == provinceId);
        if (prov) {
            setFormData({
                ...formData,
                address_province: prov.name_th,
                address_district: '',
                address_sub_district: '',
                address_postal_code: ''
            });
            try {
                const res = await api.get(`/thai-address/amphures/${provinceId}`);
                setAmphures(res.data);
                setTambons([]);
            } catch (err) { console.error(err); }
        } else {
            setFormData({ ...formData, address_province: '', address_district: '', address_sub_district: '', address_postal_code: '' });
            setAmphures([]);
            setTambons([]);
        }
    };

    const handleAmphureChange = async (e) => {
        const amphureId = e.target.value;
        const amp = amphures.find(a => a.id == amphureId);
        if (amp) {
            setFormData({
                ...formData,
                address_district: amp.name_th,
                address_sub_district: '',
                address_postal_code: ''
            });
            try {
                const res = await api.get(`/thai-address/tambons/${amphureId}`);
                setTambons(res.data);
            } catch (err) { console.error(err); }
        } else {
            setFormData({ ...formData, address_district: '', address_sub_district: '', address_postal_code: '' });
            setTambons([]);
        }
    };

    const handleTambonChange = (e) => {
        const tambonId = e.target.value;
        const tam = tambons.find(t => t.id == tambonId);
        if (tam) {
            setFormData({
                ...formData,
                address_sub_district: tam.name_th,
                address_postal_code: tam.zip_code?.toString() || ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (modalMode === 'create') {
                await api.post('/users', formData);
            } else if (modalMode === 'edit') {
                await api.put(`/users/${currentUser.id}`, formData);
            } else if (modalMode === 'password') {
                await api.put(`/users/${currentUser.id}`, {
                    password: formData.password,
                    password_confirmation: formData.password_confirmation
                });
            }
            fetchUsers();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
        setActiveMenuId(null);
        try {
            await api.delete(`/users/${user.id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete customer');
        }
    };

    const toggleMenu = (userId) => {
        if (activeMenuId === userId) {
            setActiveMenuId(null);
        } else {
            setActiveMenuId(userId);
        }
    };

    if (loading) return <div>{t('common.loading')}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{t('customer.management')}</h1>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {t('customer.create_new')}
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <div className="bg-white shadow-md rounded-lg overflow-hidden min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.username')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.phone')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('address.province')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.address_province || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleMenu(user.id); }}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                        </svg>
                                    </button>

                                    {activeMenuId === user.id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5 origin-top-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    {t('common.edit')}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenPassword(user)}
                                                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    {t('common.change_password')}
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    {t('common.delete')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleCloseModal}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        {/* This element is to trick the browser into centering the modal contents. */}
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-6 border-b pb-2">
                                {modalMode === 'create' ? t('customer.create_new') : modalMode === 'edit' ? t('customer.edit') : t('common.change_password')}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                {modalMode !== 'password' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Left Column: Account Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-md font-semibold text-gray-700 bg-gray-50 p-2 rounded">ข้อมูลบัญชี (Account)</h3>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('user.name')}</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('user.username')}</label>
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                    required
                                                    disabled={modalMode === 'edit'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('user.email')}</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('user.phone')}</label>
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">{t('user.id_card')}</label>
                                                <input
                                                    type="text"
                                                    name="id_card_number"
                                                    value={formData.id_card_number}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>

                                            {modalMode === 'create' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">{t('common.password')}</label>
                                                        <input
                                                            type="password"
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">{t('common.confirm_password')}</label>
                                                        <input
                                                            type="password"
                                                            name="password_confirmation"
                                                            value={formData.password_confirmation}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Right Column: Address Info */}
                                        <div className="space-y-4">
                                            <h3 className="text-md font-semibold text-gray-700 bg-gray-50 p-2 rounded">ข้อมูลที่อยู่ (Address)</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.house_no')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_house_no"
                                                        value={formData.address_house_no}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.village')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_village"
                                                        value={formData.address_village}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.floor')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_floor"
                                                        value={formData.address_floor}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.moo')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_moo"
                                                        value={formData.address_moo}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.soi')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_soi"
                                                        value={formData.address_soi}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.road')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_road"
                                                        value={formData.address_road}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.sub_district')}</label>
                                                    <select
                                                        name="address_sub_district"
                                                        value={tambons.find(t => t.name_th === formData.address_sub_district)?.id || ''}
                                                        onChange={handleTambonChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        disabled={!formData.address_district}
                                                    >
                                                        <option value="">{t('address.select_sub_district')}</option>
                                                        {tambons.map(t => (
                                                            <option key={t.id} value={t.id}>{getName(t)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.district')}</label>
                                                    <select
                                                        name="address_district"
                                                        value={amphures.find(a => a.name_th === formData.address_district)?.id || ''}
                                                        onChange={handleAmphureChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                        disabled={!formData.address_province}
                                                    >
                                                        <option value="">{t('address.select_district')}</option>
                                                        {amphures.map(a => (
                                                            <option key={a.id} value={a.id}>{getName(a)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.province')}</label>
                                                    <select
                                                        name="address_province"
                                                        value={provinces.find(p => p.name_th === formData.address_province)?.id || ''}
                                                        onChange={handleProvinceChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="">{t('address.select_province')}</option>
                                                        {provinces.map(p => (
                                                            <option key={p.id} value={p.id}>{getName(p)}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('address.postal_code')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_postal_code"
                                                        value={formData.address_postal_code}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                                        readOnly
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Password Change Mode
                                    <div className="max-w-md mx-auto">
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">{t('common.password')}</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">{t('common.confirm_password')}</label>
                                            <input
                                                type="password"
                                                name="password_confirmation"
                                                value={formData.password_confirmation}
                                                onChange={handleChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        {t('common.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
