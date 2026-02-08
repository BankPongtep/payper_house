import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import SignaturePad from './SignaturePad';

export default function SignedPDFModal({ pdfUrl, onSaveSignature, onClose }) {
    const [showPad, setShowPad] = useState(false);

    const handleSave = (data) => {
        onSaveSignature(data);
        setShowPad(false);
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-90 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full h-[90vh] flex flex-col relative">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">เอกสารสัญญา (Contract PDF)</h3>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowPad(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow transition"
                        >
                            <FileText size={18} />
                            ลงนาม (Sign)
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 bg-gray-100 p-4 overflow-hidden relative">
                    {pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full rounded shadow border bg-white"
                            title="Contract PDF"
                        />
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>

                {/* Signature Pad Overlay */}
                {showPad && (
                    <SignaturePad
                        onSave={handleSave}
                        onClose={() => setShowPad(false)}
                    />
                )}
            </div>
        </div>
    );
}
