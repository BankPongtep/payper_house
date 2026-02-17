import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { User, Home, X, Save, CheckCircle } from 'lucide-react'; // Added Icons

export default function Users() {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit, password
    const [currentUser, setCurrentUser] = useState(null);

    // Helper to get localized name
    const getName = (item) => {
        if (!item) return '';
        if (i18n.language === 'en' && item.name_en) {
            return item.name_en;
        }
        return item.name_th;
    };

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
        role: 'customer',
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
            const response = await api.get('/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users');
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
        setFormData({
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            id_card_number: user.id_card_number || '',
            role: user.role,
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
            // We need to wait for provinces if they aren't loaded, but they should be by now.
            // However, finding the ID is synchronous if `provinces` is state.
            // Problem: `provinces` might be empty if this is called immediately (unlikely).
            // Better to trigger a specific function.
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

    const handleToggleLock = async (user) => {
        if (!confirm(`Are you sure you want to ${user.is_locked ? 'unlock' : 'lock'} ${user.username}?`)) return;
        setActiveMenuId(null);
        try {
            await api.post(`/users/${user.id}/toggle-lock`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to toggle lock');
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Are you sure you want to delete ${user.username}? This cannot be undone (or will be soft deleted).`)) return;
        setActiveMenuId(null);
        try {
            await api.delete(`/users/${user.id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user');
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
                <h1 className="text-2xl font-bold text-gray-800">{t('user.management')}</h1>
                <button
                    onClick={handleOpenCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {t('user.create_new')}
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <div className="bg-white shadow-md rounded-lg overflow-hidden min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.username')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.phone')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user.role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{t(`roles.${user.role}`)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.is_locked ? 'Locked' : 'Active'}
                                    </span>
                                </td>
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
                                                <button
                                                    onClick={() => handleToggleLock(user)}
                                                    className={`w-full text-left block px-4 py-2 text-sm hover:bg-gray-100 ${user.is_locked ? 'text-green-600' : 'text-amber-600'}`}
                                                >
                                                    {user.is_locked ? t('user.unlock_user') : t('user.lock_user')}
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
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl transform transition-all flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                    <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {modalMode === 'create' ? 'เพิ่มผู้ใช้งานใหม่' : modalMode === 'edit' ? 'แก้ไขผู้ใช้งาน' : t('common.change_password')}
                                </h2>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="overflow-y-auto p-8 custom-scrollbar">
                            <div className="text-sm text-gray-500 mb-6">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่ในระบบ</div>

                            <form onSubmit={handleSubmit} id="userForm">
                                {modalMode !== 'password' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Left Column: Account Info */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 text-blue-800 mb-4 pb-2 border-b border-blue-50">
                                                <User className="w-5 h-5" />
                                                <h3 className="font-bold text-lg">ข้อมูลบัญชี (Account)</h3>
                                            </div>

                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('user.name')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                        placeholder="เช่น สมชาย ใจดี"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('user.username')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                                                        placeholder="username"
                                                        required
                                                        disabled={modalMode === 'edit'}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('user.email')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors ${formData.email && formData.email.includes('@') ? 'border-green-500 pr-10' : 'border-gray-300'}`}
                                                            placeholder="somchai@example.com"
                                                            required
                                                        />
                                                        {formData.email && formData.email.includes('@') && (
                                                            <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                                                        )}
                                                    </div>
                                                    {formData.email && formData.email.includes('@') && (
                                                        <p className="mt-1 text-xs text-green-600">อีเมลนี้สามารถใช้งานได้</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('user.phone')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                        placeholder="08x-xxx-xxxx"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('user.id_card')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="id_card_number"
                                                        value={formData.id_card_number}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                        placeholder="x-xxxx-xxxxx-xx-x"
                                                    />
                                                </div>

                                                {modalMode === 'create' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            ระดับผู้ใช้ <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            name="role"
                                                            value={formData.role}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white"
                                                        >
                                                            <option value="customer">roles.customer</option>
                                                            <option value="owner">roles.owner</option>
                                                            <option value="admin">roles.admin</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {modalMode === 'create' && (
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('common.password')} <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="password"
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('common.confirm_password')} <span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="password"
                                                                name="password_confirmation"
                                                                value={formData.password_confirmation}
                                                                onChange={handleChange}
                                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Column: Address Info */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 text-blue-800 mb-4 pb-2 border-b border-blue-50">
                                                <Home className="w-5 h-5" />
                                                <h3 className="font-bold text-lg">ข้อมูลที่อยู่ (Address)</h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.house_no')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_house_no"
                                                            value={formData.address_house_no}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                            placeholder="บ้านเลขที่"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.village')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_village"
                                                            value={formData.address_village}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                            placeholder="หมู่บ้าน"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.floor')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_floor"
                                                            value={formData.address_floor}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                            placeholder="ชั้น"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.moo')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_moo"
                                                            value={formData.address_moo}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                            placeholder="หมู่"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.soi')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_soi"
                                                            value={formData.address_soi}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                            placeholder="ซอย"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.road')}</label>
                                                    <input
                                                        type="text"
                                                        name="address_road"
                                                        value={formData.address_road}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                        placeholder="ถนน"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.province')}</label>
                                                        <select
                                                            name="address_province"
                                                            value={provinces.find(p => p.name_th === formData.address_province)?.id || ''}
                                                            onChange={handleProvinceChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white"
                                                        >
                                                            <option value="">เลือกจังหวัด</option>
                                                            {provinces.map(p => (
                                                                <option key={p.id} value={p.id}>{getName(p)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">อำเภอ/เขต</label>
                                                        <select
                                                            name="address_district"
                                                            value={amphures.find(a => a.name_th === formData.address_district)?.id || ''}
                                                            onChange={handleAmphureChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white"
                                                            disabled={!formData.address_province}
                                                        >
                                                            <option value="">เลือกอำเภอ/เขต</option>
                                                            {amphures.map(a => (
                                                                <option key={a.id} value={a.id}>{getName(a)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">ตำบล/แขวง</label>
                                                        <select
                                                            name="address_sub_district"
                                                            value={tambons.find(t => t.name_th === formData.address_sub_district)?.id || ''}
                                                            onChange={handleTambonChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-white"
                                                            disabled={!formData.address_district}
                                                        >
                                                            <option value="">เลือกตำบล/แขวง</option>
                                                            {tambons.map(t => (
                                                                <option key={t.id} value={t.id}>{getName(t)}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.postal_code')}</label>
                                                        <input
                                                            type="text"
                                                            name="address_postal_code"
                                                            value={formData.address_postal_code}
                                                            onChange={handleChange}
                                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors bg-gray-50"
                                                            placeholder={t('address.postal_code')}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Password Change Mode
                                    <div className="max-w-md mx-auto py-8">
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.password')}</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.confirm_password')}</label>
                                            <input
                                                type="password"
                                                name="password_confirmation"
                                                value={formData.password_confirmation}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="userForm"
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm flex items-center focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
