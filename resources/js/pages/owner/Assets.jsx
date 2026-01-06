import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Image as ImageIcon, Star, Trash2, Plus, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Assets() {
    const { t } = useTranslation();
    const [assets, setAssets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [activeTab, setActiveTab] = useState('info');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', status: 'available',
        address_house_no: '', address_village: '', address_floor: '',
        address_moo: '', address_soi: '', address_road: '',
        address_sub_district: '', address_district: '', address_province: '', address_postal_code: ''
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await api.get('/assets');
            setAssets(response.data);
        } catch (error) {
            console.error('Failed to fetch assets', error);
        }
    };

    const handleOpenModal = (asset = null) => {
        setEditingAsset(asset);
        if (asset) {
            setFormData({
                name: asset.name,
                description: asset.description,
                price: asset.price,
                status: asset.status,
                address_house_no: asset.address_house_no || '',
                address_village: asset.address_village || '',
                address_floor: asset.address_floor || '',
                address_moo: asset.address_moo || '',
                address_soi: asset.address_soi || '',
                address_road: asset.address_road || '',
                address_sub_district: asset.address_sub_district || '',
                address_district: asset.address_district || '',
                address_province: asset.address_province || '',
                address_postal_code: asset.address_postal_code || ''
            });
        } else {
            resetForm();
        }
        setActiveTab('info');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '', description: '', price: '', status: 'available',
            address_house_no: '', address_village: '', address_floor: '',
            address_moo: '', address_soi: '', address_road: '',
            address_sub_district: '', address_district: '', address_province: '', address_postal_code: ''
        });
        setSelectedImages([]);
        setPreviewImages([]);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit

        if (files.length !== validFiles.length) {
            alert('Some images were skipped because they exceed the 5MB limit.');
        }

        setSelectedImages([...selectedImages, ...validFiles]);

        // Create previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPreviewImages([...previewImages, ...newPreviews]);
    };

    const handleRemoveSelectedImage = (index) => {
        const newSelected = [...selectedImages];
        newSelected.splice(index, 1);
        setSelectedImages(newSelected);

        const newPreviews = [...previewImages];
        URL.revokeObjectURL(newPreviews[index]); // Cleanup
        newPreviews.splice(index, 1);
        setPreviewImages(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key] || ''));

        selectedImages.forEach((file) => {
            data.append('images[]', file);
        });

        try {
            if (editingAsset) {
                // For update, we need to use _method PUT since FormData doesn't support PUT directly in some setups easily
                data.append('_method', 'PUT');
                await api.post(`/assets/${editingAsset.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/assets', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setIsModalOpen(false);
            fetchAssets();
            resetForm();
        } catch (error) {
            console.error('Failed to save asset', error);
            alert('Failed to save asset. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetMainImage = async (assetId, imageId) => {
        const result = await Swal.fire({
            title: t('asset.confirm_set_main_title'),
            text: t('asset.confirm_set_main_text'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3B82F6',
            cancelButtonColor: '#6B7280',
            confirmButtonText: t('common.confirm'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            try {
                await api.post(`/assets/${assetId}/images/${imageId}/main`);
                fetchAssets();
                if (editingAsset && editingAsset.id === assetId) {
                    const fresh = await api.get(`/assets/${assetId}`);
                    setEditingAsset(fresh.data);
                }
                Swal.fire({
                    title: t('common.success'),
                    text: t('asset.main_image_set'),
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                console.error(error);
                Swal.fire(t('common.error'), t('common.something_went_wrong'), 'error');
            }
        }
    };

    const handleDeleteImage = async (assetId, imageId) => {
        const result = await Swal.fire({
            title: t('asset.confirm_delete_image_title'),
            text: t('asset.confirm_delete_image_text'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: t('common.delete'),
            cancelButtonText: t('common.cancel')
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/assets/${assetId}/images/${imageId}`);
            fetchAssets();
            if (editingAsset && editingAsset.id === assetId) {
                const fresh = await api.get(`/assets/${assetId}`);
                setEditingAsset(fresh.data);
            }
            Swal.fire({
                title: t('common.deleted'),
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('asset.management')}</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow"
                >
                    <Plus size={20} />
                    {t('asset.create_new')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assets.map(asset => (
                    <div key={asset.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100 group">
                        <div className="relative h-48 bg-gray-100">
                            {asset.main_image ? (
                                <img src={asset.main_image} alt={asset.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <ImageIcon size={48} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => handleOpenModal(asset)} className="bg-white p-2 rounded-full shadow text-gray-600 hover:text-blue-600">
                                    <Building2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-800 line-clamp-1" title={asset.name}>{asset.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${asset.status === 'available' ? 'bg-green-100 text-green-700' :
                                    (asset.status === 'leased' || asset.status === 'rented') ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                    {t(`asset.status_options.${asset.status}`) || asset.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{asset.description || t('common.no_description')}</p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <MapPin size={14} />
                                    <span className="truncate max-w-[150px]">{asset.address_province || '-'}</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">฿{Number(asset.price).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingAsset ? t('asset.edit') : t('asset.create_new')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b px-6">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 size={16} /> {t('asset.tabs.info')}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('address')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'address' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} /> {t('asset.tabs.address')}
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'images' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={16} /> {t('asset.tabs.images')}
                                </div>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="asset-form" onSubmit={handleSubmit}>
                                {/* Info Tab */}
                                {activeTab === 'info' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('asset.name')}</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('asset.description')}</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('asset.price')}</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-right"
                                                    value={formData.price ? Number(formData.price).toLocaleString() : ''}
                                                    onChange={e => {
                                                        const rawValue = e.target.value.replace(/,/g, '');
                                                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                                            setFormData({ ...formData, price: rawValue });
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('asset.status')}</label>
                                                <select
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                    value={formData.status}
                                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                                >
                                                    <option value="available">{t('asset.status_options.available')}</option>
                                                    <option value="leased">{t('asset.status_options.leased')}</option>
                                                    <option value="sold">{t('asset.status_options.sold')}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Address Tab */}
                                {activeTab === 'address' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.house_no')}</label>
                                            <input type="text" className="w-full border rounded-lg p-2" value={formData.address_house_no} onChange={e => setFormData({ ...formData, address_house_no: e.target.value })} />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.floor')}</label>
                                            <input type="text" className="w-full border rounded-lg p-2" value={formData.address_floor} onChange={e => setFormData({ ...formData, address_floor: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('address.village')}</label>
                                            <input type="text" className="w-full border rounded-lg p-2" value={formData.address_village} onChange={e => setFormData({ ...formData, address_village: e.target.value })} />
                                        </div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.moo')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_moo} onChange={e => setFormData({ ...formData, address_moo: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.soi')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_soi} onChange={e => setFormData({ ...formData, address_soi: e.target.value })} /></div>
                                        <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.road')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_road} onChange={e => setFormData({ ...formData, address_road: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.sub_district')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_sub_district} onChange={e => setFormData({ ...formData, address_sub_district: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.district')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_district} onChange={e => setFormData({ ...formData, address_district: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.province')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_province} onChange={e => setFormData({ ...formData, address_province: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('address.postal_code')}</label><input type="text" className="w-full border rounded-lg p-2" value={formData.address_postal_code} onChange={e => setFormData({ ...formData, address_postal_code: e.target.value })} /></div>
                                    </div>
                                )}

                                {/* Images Tab */}
                                {activeTab === 'images' && (
                                    <div className="space-y-6">
                                        {/* Upload Area */}
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleImageSelect}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                                <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                                                    <Plus size={24} />
                                                </div>
                                                <p className="font-medium">{t('asset.upload_images')}</p>
                                                <p className="text-xs text-gray-400">Max 5MB per file</p>
                                            </div>
                                        </div>

                                        {/* Selected New Images */}
                                        {previewImages.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">New Images</h4>
                                                <div className="grid grid-cols-4 gap-4">
                                                    {previewImages.map((src, idx) => (
                                                        <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                                                            <img src={src} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSelectedImage(idx)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Existing Images */}
                                        {editingAsset && editingAsset.images && editingAsset.images.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Images</h4>
                                                <div className="grid grid-cols-4 gap-4">
                                                    {editingAsset.images.map((img) => (
                                                        <div key={img.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group border hover:border-blue-500 transition">
                                                            <img src={img.image_path} className="w-full h-full object-cover" />
                                                            {img.is_main && (
                                                                <div className="absolute top-2 left-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded-full shadow flex items-center gap-1">
                                                                    <Star size={10} fill="white" /> Main
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 flex justify-between opacity-0 group-hover:opacity-100 transition">
                                                                {!img.is_main && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetMainImage(editingAsset.id, img.id)}
                                                                        className="text-white text-xs hover:text-yellow-400"
                                                                    >
                                                                        Set Main
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteImage(editingAsset.id, img.id)}
                                                                    className="text-red-400 hover:text-red-300 ml-auto"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="asset-form" // Link to form
                                disabled={isLoading}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
