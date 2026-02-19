import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Trash2 } from 'lucide-react';

export default function SignaturePad({ onSave, onClose, title, showNameInput = false }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';

        // Resize canvas to fill parent
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Touch or Mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        setIsDrawing(true);
        setHasSignature(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault(); // Prevent scrolling on touch

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        if (!hasSignature) return;
        if (showNameInput && !name.trim()) return;

        const canvas = canvasRef.current;
        const dataUrl = canvas.toDataURL('image/png');
        onSave({ signature: dataUrl, name: name });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[80vh] md:h-[600px]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">{title || 'ลงนามสัญญา'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {showNameInput && (
                    <div className="p-4 bg-gray-50 border-b">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ชื่อ-นามสกุล (พยาน) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="กรระบุชื่อ-นามสกุล ตัวบรรจง"
                        />
                    </div>
                )}

                <div className="flex-1 bg-gray-50 relative overflow-hidden cursor-crosshair touch-none">
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    {!hasSignature && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 select-none">
                            เซ็นชื่อที่นี่
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex justify-between gap-4">
                    <button
                        onClick={clearSignature}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                        <Trash2 size={20} />
                        ล้างลายเซ็น
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-gray-600"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasSignature || (showNameInput && !name.trim())}
                            className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg shadow transition ${hasSignature && (!showNameInput || name.trim()) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Check size={20} />
                            บันทึก
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
