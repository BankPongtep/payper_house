<!DOCTYPE html>
<html lang="th">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Contract {{ $contract->contract_number }}</title>
    <style>
        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: normal;
            src: url("{{ storage_path('fonts/THSarabunNew.ttf') }}") format('truetype');
        }

        @font-face {
            font-family: 'THSarabunNew';
            font-style: normal;
            font-weight: bold;
            src: url("{{ storage_path('fonts/THSarabunNew Bold.ttf') }}") format('truetype');
        }

        body {
            font-family: 'THSarabunNew', sans-serif;
            font-size: 16pt;
            line-height: 1.2;
            color: #333;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 24pt;
            /* Larger for header */
            font-weight: bold;
            margin: 0;
        }

        .header p {
            margin: 5px 0;
            font-size: 16pt;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .section {
            margin-bottom: 15px;
        }

        .indent {
            text-indent: 40px;
            margin-bottom: 8px;
        }

        .box {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 16pt;
        }

        th {
            background-color: #f1f1f1;
            font-weight: bold;
        }

        .signatures {
            margin-top: 50px;
            width: 100%;
        }

        .sig-block {
            width: 45%;
            float: left;
            text-align: center;
        }

        .sig-right {
            float: right;
        }

        .page-break {
            page-break-after: always;
        }

        .signature-img {
            max-height: 60px;
            max-width: 200px;
            display: block;
            margin: 0 auto;
        }
    </style>
</head>

<body>
    @php
        $isRental = $contract->contract_type === 'rental';
        $isHirePurchase = $contract->contract_type === 'hire_purchase';
    @endphp

    @if(!($onlySuffix ?? false))
    <div class="header">
        <h1>
            @if($isRental) สัญญาเช่า
            @elseif($isHirePurchase) สัญญาเช่าซื้อ
            @else สัญญาผ่อนชำระ
            @endif
        </h1>
        <p>เลขที่สัญญา: {{ $contract->contract_number }}</p>
    </div>

    <div class="text-right section">
        วันที่ทำสัญญา {{ \Carbon\Carbon::parse($contract->start_date)->isoFormat('D MMMM YYYY') }}
    </div>

    <div class="section">
        <p class="indent">
            สัญญานี้ทำขึ้นระหว่าง <strong>{{ $isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่าซื้อ' }}</strong> (ต่อไปนี้เรียกว่า
            "{{ $isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่า' }}")
            ซึ่งเป็นเจ้าของกรรมสิทธิ์ในทรัพย์สินที่ระบุในสัญญานี้ ฝ่ายหนึ่ง กับ
        </p>
        <div class="box">
            <p><strong>ชื่อ-นามสกุล:</strong> {{ $contract->customer->name ?? '-' }}</p>
            <p><strong>ที่อยู่:</strong> {{ $contract->customer->address ?? '-' }}</p>
            <p><strong>เลขบัตรประชาชน:</strong> {{ $contract->customer->national_id ?? '-' }}</p>
            <p><strong>โทรศัพท์:</strong> {{ $contract->customer->phone ?? '-' }}</p>
        </div>
        <p class="indent">
            ซึ่งต่อไปนี้เรียกว่า <strong>"{{ $isRental ? 'ผู้เช่า' : 'ผู้เช่าซื้อ' }}"</strong> อีกฝ่ายหนึ่ง
        </p>
    </div>

    <div class="section">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">ข้อ 1. ทรัพย์สินที่เช่าซื้อ</h3>
        <div class="box">
            <p><strong>ชื่อทรัพย์สิน:</strong> {{ $contract->asset->name ?? '-' }}</p>
            <p><strong>ประเภท:</strong> {{ $contract->asset->type ?? '-' }}</p>
            <p><strong>รายละเอียด:</strong> {{ $contract->asset->description ?? '-' }}</p>
        </div>
    </div>

    <div class="section">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">ข้อ 2. ราคาและการชำระเงิน</h3>
        <table>
            <tbody>
                @if($isRental)
                    <tr>
                        <td style="background-color: #f9f9f9; width: 50%;">อัตราค่าเช่า</td>
                        <td class="text-right font-bold">{{ number_format($contract->installment_amount) }} บาท / เดือน</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">เงินประกันความเสียหาย</td>
                        <td class="text-right">{{ number_format($contract->down_payment) }} บาท</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">กำหนดชำระค่าเช่า</td>
                        <td class="text-right">ภายในวันที่ {{ \Carbon\Carbon::parse($contract->start_date)->day }}
                            ของทุกเดือน</td>
                    </tr>
                @else
                    <tr>
                        <td style="background-color: #f9f9f9; width: 50%;">ราคาเช่าซื้อรวมทั้งสิ้น</td>
                        <td class="text-right">{{ number_format($contract->total_price) }} บาท</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">เงินดาวน์</td>
                        <td class="text-right">{{ number_format($contract->down_payment) }} บาท</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">เงินต้นหลังหักดาวน์</td>
                        <td class="text-right">{{ number_format($contract->principal_amount) }} บาท</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">อัตราดอกเบี้ย</td>
                        <td class="text-right">{{ $contract->interest_rate }}% ต่อปี</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">จำนวนงวด</td>
                        <td class="text-right">{{ $contract->installments_count }} งวด</td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9;">ค่างวดต่อเดือน</td>
                        <td class="text-right font-bold">{{ number_format($contract->installment_amount) }} บาท</td>
                    </tr>
                    @if($isHirePurchase && $contract->balloon_payment > 0)
                        <tr>
                            <td style="background-color: #fff3cd;">ยอดคงเหลือ (Balloon Payment)</td>
                            <td class="text-right font-bold" style="color: #856404;">
                                {{ number_format($contract->balloon_payment) }} บาท
                            </td>
                        </tr>
                    @endif
                @endif
                <tr>
                    <td style="background-color: #f9f9f9;">ระยะเวลาสัญญา</td>
                    <td class="text-right">
                        {{ \Carbon\Carbon::parse($contract->start_date)->isoFormat('D MMM YYYY') }} ถึง
                        {{ \Carbon\Carbon::parse($contract->end_date)->isoFormat('D MMM YYYY') }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">ข้อ 3. เงื่อนไขทั่วไป</h3>
        @if($isRental)
            <p class="indent">
                3.1 ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าภายในกำหนดเวลาที่ระบุไว้ หากล่าช้าเกิน 7 วัน
                ผู้ให้เช่ามีสิทธิ์คิดค่าปรับ หรือบอกเลิกสัญญาได้ทันที
            </p>
            <p class="indent">
                3.2 ผู้เช่าตกลงที่จะดูแลรักษาทรัพย์สินที่เช่าให้อยู่ในสภาพเรียบร้อย และจะไม่ทำการดัดแปลง
                ต่อเติม หรือแก้ไขส่วนหนึ่งส่วนใดของทรัพย์สิน โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่า
            </p>
            <p class="indent">
                3.3 ผู้เช่าสัญญาว่าจะไม่นำทรัพย์สินที่เช่านี้ไปให้ผู้อื่นเช่าช่วง หรือโอนสิทธิ์การเช่าให้แก่บุคคลภายนอก
            </p>
            <p class="indent">
                3.4 เมื่อสัญญาเช่าสิ้นสุดลง หรือถูกบอกเลิกสัญญา ผู้เช่าตกลงส่งมอบทรัพย์สินคืนแก่ผู้ให้เช่าในสภาพเรียบร้อย
                หากมีความเสียหายเกิดขึ้น ผู้เช่ายินยอมให้ผู้ให้เช่าหักเงินประกันเพื่อชดใช้ค่าเสียหายดังกล่าวตามความเป็นจริง
            </p>
        @else
            <p class="indent">
                3.1 กรรมสิทธิ์ในทรัพย์สินที่เช่าซื้อยังคงเป็นของผู้ให้เช่า จนกว่าผู้เช่าซื้อจะชำระค่าเช่าซื้อครบถ้วนตามสัญญา
            </p>
            <p class="indent">
                3.2 ผู้เช่าซื้อต้องชำระค่างวดตรงตามกำหนดในทุกๆ เดือน หากผิดนัดชำระเกินกว่า 30 วัน
                ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาและเรียกทรัพย์สินคืนได้ทันที
            </p>
            <p class="indent">
                3.3 ผู้เช่าซื้อต้องดูแลรักษาทรัพย์สินให้อยู่ในสภาพดี หากเสียหายหรือสูญหายต้องรับผิดชอบซ่อมแซมหรือชดใช้
            </p>
            <p class="indent">
                3.4 ผู้เช่าซื้อไม่สามารถนำทรัพย์สินไปจำหน่าย จำนำ หรือโอนสิทธิให้บุคคลอื่นได้
                โดยไม่ได้รับความยินยอมจากผู้ให้เช่า
            </p>
            @if($isHirePurchase && $contract->balloon_payment > 0)
                <p class="indent" style="background-color: #fff3cd; padding: 5px;">
                    3.5 เมื่อครบกำหนดระยะเวลาผ่อนชำระตามสัญญานี้ ผู้เช่าซื้อจะต้องชำระยอดคงเหลือ (Balloon Payment)
                    จำนวน <strong>{{ number_format($contract->balloon_payment) }} บาท</strong> เพื่อรับโอนกรรมสิทธิ์ในทรัพย์สิน
                    หรือสามารถต่อสัญญาเช่าซื้อออกไปตามเงื่อนไขที่ตกลงกัน
                </p>
            @endif
        @endif
    </div>

    <div class="page-break"></div>
    @endif

    <div class="section">
        <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 5px;">ตารางผ่อนชำระ</h3>
        <table>
            <thead>
                <tr style="background-color: #eee;">
                    <th>งวดที่</th>
                    <th>วันครบกำหนด</th>
                    <th>จำนวนเงิน (บาท)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($contract->installments as $inst)
                    <tr>
                        <td class="text-center">{{ $loop->iteration }}</td>
                        <td class="text-center">{{ \Carbon\Carbon::parse($inst->due_date)->isoFormat('D MMM YYYY') }}</td>
                        <td class="text-right">{{ number_format($inst->amount) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="signatures">
        <table style="width: 100%; border: none;">
            <tr>
                <td style="width: 50%; border: none; padding: 10px; text-align: center; vertical-align: top;">
                    <!-- Owner -->
                    <div style="border: 1px solid #ccc; height: 120px; position: relative;">
                        @if(!empty($contract->owner_signature_path) && file_exists(storage_path('app/public/' . $contract->owner_signature_path)))
                            <img src="{{ storage_path('app/public/' . $contract->owner_signature_path) }}" 
                                 style="width: 100%; height: 100%; object-fit: contain;">
                        @endif
                    </div>
                    <div style="margin-top: 5px;">
                        ( {{ $contract->owner->name ?? '............................................................' }} ) <br>
                        {{ $isRental ? 'ผู้ให้เช่า' : 'ผู้ให้เช่าซื้อ' }}
                    </div>
                </td>
                <td style="width: 50%; border: none; padding: 10px; text-align: center; vertical-align: top;">
                    <!-- Customer -->
                    <div style="border: 1px solid #ccc; height: 120px; position: relative;">
                        @php $custSig = $contract->customer_signature_path ?? $contract->signature_path; @endphp
                        @if(!empty($custSig) && file_exists(storage_path('app/public/' . $custSig)))
                            <img src="{{ storage_path('app/public/' . $custSig) }}" 
                                 style="width: 100%; height: 100%; object-fit: contain;">
                        @endif
                    </div>
                    <div style="margin-top: 5px;">
                        ( {{ $contract->customer->name ?? '............................................................' }} ) <br>
                        {{ $isRental ? 'ผู้เช่า' : 'ผู้เช่าซื้อ' }}
                    </div>
                </td>
            </tr>
            <tr>
                <td style="width: 50%; border: none; padding: 10px; text-align: center; vertical-align: top; padding-top: 30px;">
                    <!-- Witness 1 -->
                    @if(!empty($contract->witness1_signature_path))
                        <div style="border: 1px solid #ccc; height: 120px; position: relative;">
                             @if(file_exists(storage_path('app/public/' . $contract->witness1_signature_path)))
                                <img src="{{ storage_path('app/public/' . $contract->witness1_signature_path) }}" 
                                     style="width: 100%; height: 100%; object-fit: contain;">
                             @endif
                        </div>
                    @else
                        <div style="border-bottom: 1px dotted #000; height: 100px; margin-bottom: 10px;"></div>
                    @endif
                    <div style="margin-top: 5px;">
                        ( {{ $contract->witness1_name ?? '............................................................' }} ) <br>
                        พยาน
                    </div>
                </td>
                <td style="width: 50%; border: none; padding: 10px; text-align: center; vertical-align: top; padding-top: 30px;">
                    <!-- Witness 2 -->
                    @if(!empty($contract->witness2_signature_path))
                        <div style="border: 1px solid #ccc; height: 120px; position: relative;">
                             @if(file_exists(storage_path('app/public/' . $contract->witness2_signature_path)))
                                <img src="{{ storage_path('app/public/' . $contract->witness2_signature_path) }}" 
                                     style="width: 100%; height: 100%; object-fit: contain;">
                             @endif
                        </div>
                    @else
                        <div style="border-bottom: 1px dotted #000; height: 100px; margin-bottom: 10px;"></div>
                    @endif
                    <div style="margin-top: 5px;">
                        ( {{ $contract->witness2_name ?? '............................................................' }} ) <br>
                        พยาน
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>

</html>