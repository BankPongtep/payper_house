import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import SignaturePad from './SignaturePad';

export default function SignedPDFModal({ pdfUrl, onSaveSignature, onClose, signatures = {} }) {
    const [showPad, setShowPad] = useState(false);
    const [signingType, setSigningType] = useState(null); // 'owner' or 'customer'

    const handleSignClick = (type) => {
        setSigningType(type);
        setShowPad(true);
    };

    const handleSave = (data) => {
        onSaveSignature(data, signingType);
        setShowPad(false);
        setSigningType(null);
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-90 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full h-[90vh] flex flex-col relative">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">เอกสารสัญญา (Contract PDF)</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => !signatures.owner && handleSignClick('owner')}
                            disabled={signatures.owner}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow transition ${signatures.owner ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed opacity-80' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            <FileText size={18} />
                            {signatures.owner ? 'เซ็นแล้ว (Owner Signed)' : 'ลงนามเจ้าของ (Sign Owner)'}
                        </button>
                        <button
                            onClick={() => !signatures.customer && handleSignClick('customer')}
                            disabled={signatures.customer}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow transition ${signatures.customer ? 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed opacity-80' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                        >
                            <FileText size={18} />
                            {signatures.customer ? 'เซ็นแล้ว (Customer Signed)' : 'ลงนามลูกค้า (Sign Customer)'}
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-2">
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
                        title={signingType === 'owner' ? 'ลงนามเจ้าของ (Owner Signature)' : 'ลงนามลูกค้า (Customer Signature)'}
                    />
                )}
            </div>
        </div>
    );
}
