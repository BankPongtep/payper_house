import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Lock, User, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api';

export default function CustomerSettings() {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load initial user data from local storage or API
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setName(parsed.name);
        }
        // Ideally fetch fresh data from API
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profile');
            setUser(res.data);
            setName(res.data.name);
            // Update local storage
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: name,
        };

        if (password) {
            if (password !== passwordConfirmation) {
                Swal.fire({
                    icon: 'error',
                    title: t('common.error'),
                    text: t('settings.passwords_do_not_match')
                });
                setLoading(false);
                return;
            }
            if (password.length < 8) {
                Swal.fire({
                    icon: 'error',
                    title: t('common.error'),
                    text: t('settings.password_too_short')
                });
                setLoading(false);
                return;
            }
            payload.password = password;
            payload.password_confirmation = passwordConfirmation;
        }

        try {
            const res = await api.put('/profile', payload);
            Swal.fire({
                icon: 'success',
                title: t('common.success'),
                text: t('settings.profile_updated'),
                timer: 1500,
                showConfirmButton: false
            });
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setPassword('');
            setPasswordConfirmation('');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: t('common.error'),
                text: error.response?.data?.message || t('common.something_went_wrong')
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={28} className="text-blue-600" />
                {t('settings.profile_settings')}
            </h1>

            <div className="bg-white rounded-xl shadow-sm border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-only Username/Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">{t('user.username')}</label>
                            <input
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">{t('user.email')}</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-1">{t('user.role')}</label>
                            <input
                                type="text"
                                value={t(`common.${user?.role}`) || user?.role || ''}
                                disabled
                                className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Editable Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('user.name')}</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <Lock size={16} />
                            {t('settings.change_password')}
                            <span className="text-xs font-normal text-blue-600">({t('settings.leave_blank')})</span>
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.new_password')}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('settings.min_8_chars')}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.confirm_password')}</label>
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                {t('common.save')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
