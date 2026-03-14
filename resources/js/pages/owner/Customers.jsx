import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api';
import { Search, Plus, CheckCircle2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Customers() {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);

    // Search and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filter and paginate users
    const filteredUsers = users.filter((user) => {
        const term = searchTerm.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(term)) ||
            (user.username && user.username.toLowerCase().includes(term)) ||
            (user.phone && user.phone.includes(term)) ||
            (user.address_province && user.address_province.toLowerCase().includes(term))
        );
    });

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
    const [usernameAvailable, setUsernameAvailable] = useState(null); // null = untested, true = available, false = taken
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

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
        setUsernameAvailable(null);
        setIsCheckingUsername(false);
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
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'username' && modalMode === 'create') {
            checkUsername(value);
        }
    };

    const checkUsername = async (username) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        setIsCheckingUsername(true);
        try {
            const res = await api.get(`/users/check-username?username=${username}`);
            setUsernameAvailable(res.data.available);
        } catch (err) {
            setUsernameAvailable(null);
        } finally {
            setIsCheckingUsername(false);
        }
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
                if (formData.password !== formData.password_confirmation) {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
                        confirmButtonText: 'ตกลง'
                    });
                    return;
                }
                await api.post('/users', formData);
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: 'สร้างบัญชีผู้ใช้ใหม่เรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (modalMode === 'edit') {
                // Remove password from payload if empty to satisfy validation
                const updatePayload = { ...formData };
                if (!updatePayload.password) {
                    delete updatePayload.password;
                    delete updatePayload.password_confirmation;
                }

                await api.put(`/users/${currentUser.id}`, updatePayload);
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: 'แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (modalMode === 'password') {
                if (formData.password !== formData.password_confirmation) {
                    Swal.fire({
                        icon: 'error',
                        title: 'เกิดข้อผิดพลาด',
                        text: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
                        confirmButtonText: 'ตกลง'
                    });
                    return;
                }
                await api.put(`/users/${currentUser.id}`, {
                    password: formData.password,
                    password_confirmation: formData.password_confirmation
                });
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            fetchUsers();
            handleCloseModal();
        } catch (err) {
            let errorMsg = err.response?.data?.message || 'Operation failed';
            if (err.response?.data?.errors) {
                errorMsg = Object.values(err.response.data.errors)
                    .flat()
                    .map(msg => t(msg, msg)) // Try to translate, fallback to original message
                    .join('\n');
            }
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: errorMsg,
                confirmButtonText: 'ตกลง'
            });
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
        setActiveMenuId(null);
        try {
            await api.delete(`/users/${user.id}`);
            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว',
                timer: 2000,
                showConfirmButton: false
            });
            fetchUsers();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: err.response?.data?.message || 'Failed to delete customer',
                confirmButtonText: 'ตกลง'
            });
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
        <div className="pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">{t('customer.management')}</h1>
                <div className="flex w-full md:w-auto space-x-3 items-center">
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            id="search-customer"
                            type="text"
                            placeholder="ค้นหารายชื่อ, เบอร์โทร..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border-0 bg-gray-100/70 rounded-lg focus:ring-2 focus:ring-blue-100 focus:bg-white w-full transition-colors text-sm text-gray-600 placeholder-gray-400"
                        />
                    </div>
                    <button
                        id="btn-add-customer"
                        onClick={handleOpenCreate}
                        className="bg-[#007BFF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        เพิ่มลูกค้าใหม่
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-xl overflow-visible min-h-[400px]">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-transparent">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">ชื่อผู้ใช้ (Username)</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">เบอร์โทรศัพท์</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">จังหวัด</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedUsers.length > 0 ? (
                            paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.address_province || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <div className="flex justify-end items-center space-x-3">
                                            <button
                                                id={`btn-menu-customer-${user.id}`}
                                                onClick={(e) => { e.stopPropagation(); toggleMenu(user.id); }}
                                                className="text-blue-500 hover:text-blue-700 focus:outline-none font-medium text-sm transition-colors"
                                            >
                                                แก้ไข
                                            </button>
                                        </div>

                                        {activeMenuId === user.id && (
                                            <div
                                                ref={menuRef}
                                                className="absolute right-6 mt-1.5 w-40 bg-white rounded-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] z-50 ring-1 ring-black ring-opacity-5 origin-top-right text-left overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                                                    >
                                                        {t('common.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenPassword(user)}
                                                        className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                                                    >
                                                        {t('common.change_password')}
                                                    </button>
                                                    <div className="border-t border-gray-100 my-0.5"></div>
                                                    <button
                                                        id={`btn-delete-customer-${user.id}`}
                                                        onClick={() => handleDelete(user)}
                                                        className="w-full text-left block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium"
                                                    >
                                                        {t('common.delete')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                                    ไม่พบข้อมูลลูกค้า
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls inside the table container */}
                {
                    totalPages > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                                แสดง {Math.min((currentPage - 1) * itemsPerPage + 1, filteredUsers.length)} ถึง {Math.min(currentPage * itemsPerPage, filteredUsers.length)} จาก {filteredUsers.length} รายการ
                            </div>
                            <div className="flex space-x-1 border border-gray-200 rounded-md bg-white p-0.5 shadow-sm">
                                <button
                                    id="btn-prev-page"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    &lt;
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        id={`btn-page-${i + 1}`}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`min-w-[32px] px-2 py-1 text-sm rounded transition-colors ${currentPage === i + 1
                                            ? 'bg-blue-600 text-white font-medium shadow-[0_2px_4px_rgba(37,99,235,0.2)]'
                                            : 'text-gray-600 hover:bg-gray-50 bg-white font-medium'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    id="btn-next-page"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* Modal */}
            {
                showModal && (
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

                                <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                                    {modalMode !== 'password' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left Column: Account Info */}
                                            <div className="space-y-4">
                                                <h3 className="text-md font-semibold text-gray-700 bg-gray-50 p-2 rounded">ข้อมูลบัญชี (Account)</h3>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('user.name')}</label>
                                                    <input
                                                        id="input-customer-name"
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
                                                    <div className="relative">
                                                        <input
                                                            id="input-customer-username"
                                                            type="text"
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleChange}
                                                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${modalMode === 'create' && usernameAvailable === true ? 'border-green-500 ring-1 ring-green-500' :
                                                                modalMode === 'create' && usernameAvailable === false ? 'border-red-500 ring-1 ring-red-500' :
                                                                    'border-gray-300'
                                                                }`}
                                                            required
                                                            disabled={modalMode === 'edit'}
                                                        />
                                                        {modalMode === 'create' && usernameAvailable === true && (
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none mt-1">
                                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                            </div>
                                                        )}
                                                        {modalMode === 'create' && usernameAvailable === false && (
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none mt-1">
                                                                <XCircle className="h-5 w-5 text-red-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('user.email')}</label>
                                                    <input
                                                        id="input-customer-email"
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">{t('user.phone')}</label>
                                                    <input
                                                        id="input-customer-phone"
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
                                                        id="input-customer-id-card"
                                                        type="text"
                                                        name="id_card_number"
                                                        value={formData.id_card_number}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                </div>

                                                {modalMode === 'create' && (() => {
                                                    const passwordsMatch = formData.password && formData.password_confirmation
                                                        ? formData.password === formData.password_confirmation
                                                        : null;

                                                    const getBorderClass = (val) => {
                                                        if (!val) return 'border-gray-300';
                                                        if (passwordsMatch === true) return 'border-green-500 ring-1 ring-green-500';
                                                        if (passwordsMatch === false && formData.password_confirmation) return 'border-red-500 ring-1 ring-red-500';
                                                        return 'border-gray-300';
                                                    };

                                                    return (
                                                        <>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">{t('common.password')}</label>
                                                                <input
                                                                    id="input-customer-password"
                                                                    type="password"
                                                                    name="password"
                                                                    value={formData.password}
                                                                    onChange={handleChange}
                                                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${getBorderClass(formData.password)}`}
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">{t('common.confirm_password')}</label>
                                                                <input
                                                                    id="input-customer-password-confirm"
                                                                    type="password"
                                                                    name="password_confirmation"
                                                                    value={formData.password_confirmation}
                                                                    onChange={handleChange}
                                                                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${getBorderClass(formData.password_confirmation)}`}
                                                                    required
                                                                />
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Right Column: Address Info */}
                                            <div className="space-y-4">
                                                <h3 className="text-md font-semibold text-gray-700 bg-gray-50 p-2 rounded">ข้อมูลที่อยู่ (Address)</h3>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">{t('address.house_no')}</label>
                                                        <input
                                                            id="input-customer-house-no"
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
                                                            id="input-customer-village"
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
                                                            id="input-customer-floor"
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
                                                            id="input-customer-moo"
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
                                                            id="input-customer-soi"
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
                                                            id="input-customer-road"
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
                                                        <label className="block text-sm font-medium text-gray-700">{t('address.province')}</label>
                                                        <select
                                                            id="select-customer-province"
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
                                                        <label className="block text-sm font-medium text-gray-700">{t('address.district')}</label>
                                                        <select
                                                            id="select-customer-district"
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
                                                        <label className="block text-sm font-medium text-gray-700">{t('address.sub_district')}</label>
                                                        <select
                                                            id="select-customer-sub-district"
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
                                                        <label className="block text-sm font-medium text-gray-700">{t('address.postal_code')}</label>
                                                        <input
                                                            id="input-customer-postal-code"
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
                                            {(() => {
                                                const passwordsMatch = formData.password && formData.password_confirmation
                                                    ? formData.password === formData.password_confirmation
                                                    : null;

                                                const getBorderClass = (val) => {
                                                    if (!val) return 'border-gray-300';
                                                    if (passwordsMatch === true) return 'border-green-500 ring-1 ring-green-500';
                                                    if (passwordsMatch === false && formData.password_confirmation) return 'border-red-500 ring-1 ring-red-500';
                                                    return 'border-gray-300';
                                                };

                                                return (
                                                    <>
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-medium text-gray-700">{t('common.password')}</label>
                                                            <input
                                                                id="input-customer-password"
                                                                type="password"
                                                                name="password"
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${getBorderClass(formData.password)}`}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="mb-4">
                                                            <label className="block text-sm font-medium text-gray-700">{t('common.confirm_password')}</label>
                                                            <input
                                                                id="input-customer-password-confirm"
                                                                type="password"
                                                                name="password_confirmation"
                                                                value={formData.password_confirmation}
                                                                onChange={handleChange}
                                                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${getBorderClass(formData.password_confirmation)}`}
                                                                required
                                                            />
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                                        <button
                                            id="btn-close-modal"
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            id="btn-save-customer"
                                            type="submit"
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        >
                                            {t('common.save')}
                                        </button>
                                    </div>
                                </form>
                            </div >
                        </div >
                    </div >
                )
            }
        </div >
    );
}
