import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.read_at).length);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        // Fetch notifications on page load
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id, notification) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Navigate if needed based on type
            if (notification.data.installment_id) {
                // navigate somewhere? maybe just stay.
            }
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleClearAll = async () => {
        try {
            await api.post('/notifications/clear');
            setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    };

    const unreadNotifications = notifications.filter(n => !n.read_at);
    // Show unread first, then recent read
    const displayNotifications = [...notifications].sort((a, b) => {
        if (!a.read_at && b.read_at) return -1;
        if (a.read_at && !b.read_at) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full focus:outline-none transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">{t('common.notifications', 'Notifications')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                <Check size={14} />
                                {t('common.mark_all_read', 'Mark all read')}
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {displayNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                {t('common.no_notifications', 'No notifications')}
                            </div>
                        ) : (
                            displayNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 transition-colors flex gap-3 ${!notification.read_at ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {/* Icon based on type */}
                                        <div className={`w-2 h-2 rounded-full ${!notification.read_at ? 'bg-blue-600' : 'bg-transparent'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm ${!notification.read_at ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {notification.data.title}
                                            </p>
                                            {!notification.read_at && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id, notification);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-600 p-1"
                                                    title={t('common.mark_read')}
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.data.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(notification.created_at).toLocaleString('th-TH')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
