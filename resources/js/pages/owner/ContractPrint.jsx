import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api';

export default function ContractPrint() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const response = await api.get(`/contracts/${id}`);
            setContract(response.data);
        } catch (err) {
            console.error('Failed to fetch contract:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatNumber = (num) => {
        return Number(num || 0).toLocaleString('th-TH');
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!contract) {
        return <div className="text-center py-10">ไม่พบสัญญา</div>;
    }

    const isHirePurchase = contract.contract_type === 'hire_purchase';
    const isRental = contract.contract_type === 'rental';

    return (
        <>
            {/* Print button - hidden when printing */}
            <div className="print:hidden fixed top-4 right-4 z-50">
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition"
                >
                    🖨️ พิมพ์สัญญา
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-8 bg-white print:p-0 print:max-w-none">
                {/* Contract Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">
                        {isRental ? 'สัญญาเช่า' : (isHirePurchase ? 'สัญญาเช่าซื้อ' : 'สัญญาผ่อนชำระ')}
                    </h1>
                    <p className="text-gray-600">เลขที่สัญญา: {contract.contract_number}</p>
                </div>

                {/* Date */}
                <div className="text-right mb-6">
                    <p>วันที่ทำสัญญา {formatDate(contract.start_date)}</p>
                </div>

                {/* Parties Introduction */}
                <div className="mb-6 leading-relaxed text-justify">
                    <p className="indent-8">
                        สัญญานี้ทำขึ้นระหว่าง <strong>{isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่าซื้อ'}</strong> (ต่อไปนี้เรียกว่า "{isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่า'}")
                        ซึ่งเป็นเจ้าของกรรมสิทธิ์ในทรัพย์สินที่ระบุในสัญญานี้ ฝ่ายหนึ่ง กับ
                    </p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p><strong>ชื่อ-นามสกุล:</strong> {contract.customer?.name}</p>
                        <p><strong>ที่อยู่:</strong> {contract.customer?.address || '-'}</p>
                        <p><strong>เลขบัตรประชาชน:</strong> {contract.customer?.national_id || '-'}</p>
                        <p><strong>โทรศัพท์:</strong> {contract.customer?.phone || '-'}</p>
                    </div>
                    <p className="mt-4 indent-8">
                        ซึ่งต่อไปนี้เรียกว่า <strong>"{isRental ? 'ผู้เช่า' : 'ผู้เช่าซื้อ'}"</strong> อีกฝ่ายหนึ่ง
                    </p>
                </div>

                {/* Asset Details */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">ข้อ 1. ทรัพย์สินที่เช่าซื้อ</h2>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p><strong>ชื่อทรัพย์สิน:</strong> {contract.asset?.name}</p>
                        <p><strong>ประเภท:</strong> {contract.asset?.type || '-'}</p>
                        <p><strong>รายละเอียด:</strong> {contract.asset?.description || '-'}</p>
                    </div>
                </div>

                {/* Financial Terms */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">ข้อ 2. ราคาและการชำระเงิน</h2>
                    <table className="w-full border-collapse border border-gray-300">
                        <tbody>
                            {isRental ? (
                                <>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium w-1/2">อัตราค่าเช่า</td>
                                        <td className="p-3 text-right font-bold text-blue-600">{formatNumber(contract.installment_amount)} บาท / เดือน</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">เงินประกันความเสียหาย</td>
                                        <td className="p-3 text-right">{formatNumber(contract.down_payment)} บาท</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">กำหนดชำระค่าเช่า</td>
                                        <td className="p-3 text-right">ภายในวันที่ {new Date(contract.start_date).getDate()} ของทุกเดือน</td>
                                    </tr>
                                </>
                            ) : (
                                <>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium w-1/2">ราคาเช่าซื้อรวมทั้งสิ้น</td>
                                        <td className="p-3 text-right">{formatNumber(contract.total_price)} บาท</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">เงินดาวน์</td>
                                        <td className="p-3 text-right">{formatNumber(contract.down_payment)} บาท</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">เงินต้นหลังหักดาวน์</td>
                                        <td className="p-3 text-right">{formatNumber(contract.principal_amount)} บาท</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">อัตราดอกเบี้ย</td>
                                        <td className="p-3 text-right">{contract.interest_rate}% ต่อปี</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">จำนวนงวด</td>
                                        <td className="p-3 text-right">{contract.installments_count} งวด</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="p-3 bg-gray-50 font-medium">ค่างวดต่อเดือน</td>
                                        <td className="p-3 text-right font-bold text-blue-600">{formatNumber(contract.installment_amount)} บาท</td>
                                    </tr>
                                    {isHirePurchase && contract.balloon_payment > 0 && (
                                        <tr className="border-b bg-amber-50">
                                            <td className="p-3 font-medium">ยอดคงเหลือ (Balloon Payment)</td>
                                            <td className="p-3 text-right font-bold text-amber-600">{formatNumber(contract.balloon_payment)} บาท</td>
                                        </tr>
                                    )}
                                </>
                            )}
                            <tr>
                                <td className="p-3 bg-gray-50 font-medium">ระยะเวลาสัญญา</td>
                                <td className="p-3 text-right">
                                    {formatDate(contract.start_date)} ถึง {formatDate(contract.end_date)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Terms and Conditions */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">ข้อ 3. เงื่อนไขทั่วไป</h2>
                    <div className="text-sm leading-relaxed space-y-3">
                        {isRental ? (
                            <>
                                <p className="indent-8">
                                    3.1 ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าภายในกำหนดเวลาที่ระบุไว้ หากล่าช้าเกิน 7 วัน
                                    ผู้ให้เช่ามีสิทธิ์คิดค่าปรับ หรือบอกเลิกสัญญาได้ทันที
                                </p>
                                <p className="indent-8">
                                    3.2 ผู้เช่าตกลงที่จะดูแลรักษาทรัพย์สินที่เช่าให้อยู่ในสภาพเรียบร้อย และจะไม่ทำการดัดแปลง
                                    ต่อเติม หรือแก้ไขส่วนหนึ่งส่วนใดของทรัพย์สิน โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
                                </p>
                                <p className="indent-8">
                                    3.3 ผู้เช่าสัญญาว่าจะไม่นำทรัพย์สินที่เช่านี้ไปให้ผู้อื่นเช่าช่วง หรือโอนสิทธิ์การเช่าให้แก่บุคคลภายนอก
                                </p>
                                <p className="indent-8">
                                    3.4 เมื่อสัญญาเช่าสิ้นสุดลง หรือถูกบอกเลิกสัญญา ผู้เช่าตกลงส่งมอบทรัพย์สินคืนแก่ผู้ให้เช่าในสภาพเรียบร้อย
                                    หากมีความเสียหายเกิดขึ้น ผู้เช่ายินยอมให้ผู้ให้เช่าหักเงินประกันเพื่อชดใช้ค่าเสียหายดังกล่าวตามความเป็นจริง
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="indent-8">
                                    3.1 กรรมสิทธิ์ในทรัพย์สินที่เช่าซื้อยังคงเป็นของผู้ให้เช่า จนกว่าผู้เช่าซื้อจะชำระค่าเช่าซื้อครบถ้วนตามสัญญา
                                </p>
                                <p className="indent-8">
                                    3.2 ผู้เช่าซื้อต้องชำระค่างวดตรงตามกำหนดในทุกๆ เดือน หากผิดนัดชำระเกินกว่า 30 วัน
                                    ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาและเรียกทรัพย์สินคืนได้ทันที
                                </p>
                                <p className="indent-8">
                                    3.3 ผู้เช่าซื้อต้องดูแลรักษาทรัพย์สินให้อยู่ในสภาพดี หากเสียหายหรือสูญหายต้องรับผิดชอบซ่อมแซมหรือชดใช้
                                </p>
                                <p className="indent-8">
                                    3.4 ผู้เช่าซื้อไม่สามารถนำทรัพย์สินไปจำหน่าย จำนำ หรือโอนสิทธิให้บุคคลอื่นได้ โดยไม่ได้รับความยินยอมจากผู้ให้เช่า
                                </p>
                                {isHirePurchase && contract.balloon_payment > 0 && (
                                    <p className="indent-8 text-amber-700 bg-amber-50 p-3 rounded">
                                        3.5 เมื่อครบกำหนดระยะเวลาผ่อนชำระตามสัญญานี้ ผู้เช่าซื้อจะต้องชำระยอดคงเหลือ (Balloon Payment)
                                        จำนวน <strong>{formatNumber(contract.balloon_payment)} บาท</strong> เพื่อรับโอนกรรมสิทธิ์ในทรัพย์สิน
                                        หรือสามารถต่อสัญญาเช่าซื้อออกไปตามเงื่อนไขที่ตกลงกัน
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Installment Schedule */}
                <div className="mb-6 page-break-before-always">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2">ตารางผ่อนชำระ</h2>
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-center">งวดที่</th>
                                <th className="border p-2 text-center">วันครบกำหนด</th>
                                <th className="border p-2 text-right">จำนวนเงิน (บาท)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contract.installments?.map((inst, idx) => (
                                <tr key={inst.id}>
                                    <td className="border p-2 text-center">{idx + 1}</td>
                                    <td className="border p-2 text-center">{formatDate(inst.due_date)}</td>
                                    <td className="border p-2 text-right">{formatNumber(inst.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Signatures */}
                <div className="mt-12 grid grid-cols-2 gap-16">
                    <div className="text-center">
                        <div className="border-t border-black pt-4 mt-20">
                            <p>ลงชื่อ ____________________________</p>
                            <p className="mt-2">( ______________________________ )</p>
                            <p className="mt-1 text-sm text-gray-600">{isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่าซื้อ'}</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black pt-4 mt-20">
                            <p>ลงชื่อ ____________________________</p>
                            <p className="mt-2">( {contract.customer?.name} )</p>
                            <p className="mt-1 text-sm text-gray-600">{isRental ? 'ผู้เช่า' : 'ผู้เช่าซื้อ'}</p>
                        </div>
                    </div>
                </div>

                {/* Witness */}
                <div className="mt-12 grid grid-cols-2 gap-16">
                    <div className="text-center">
                        <div className="border-t border-black pt-4 mt-16">
                            <p>ลงชื่อ ____________________________</p>
                            <p className="mt-2">พยาน</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black pt-4 mt-16">
                            <p>ลงชื่อ ____________________________</p>
                            <p className="mt-2">พยาน</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .page-break-before-always { page-break-before: always; }
                }
            `}</style>
        </>
    );
}
