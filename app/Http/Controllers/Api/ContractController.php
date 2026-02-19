<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Installment;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade as PDF;
use App\Models\ContractDocument;
use Intervention\Image\Facades\Image;

class ContractController extends Controller
{
    private function resizeAndSaveImage($imageFile, $pathPrefix = 'contract_docs')
    {
        $image = Image::make($imageFile);

        // Resize if width > 800px
        if ($image->width() > 800) {
            $image->resize(800, null, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize(); // Prevent upsizing
            });
        }

        // Encode as jpg with 80% quality
        $encoded = $image->encode('jpg', 80);

        $filename = $pathPrefix . '/' . Str::random(40) . '.jpg';
        Storage::disk('public')->put($filename, (string) $encoded);

        return $filename;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $search = $request->input('search');

        if ($user->role === 'owner') {
            $query = $user->contracts()->with(['customer', 'asset']);
        } else {
            // If customer, find contracts linked to their customer profile (if user_id linked)
            $query = Contract::whereHas('customer', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })->with(['asset']);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cQ) use ($search) {
                        $cQ->where('name', 'like', "%{$search}%")
                            ->orWhere('id_card_number', 'like', "%{$search}%");
                    });
            });
        }

        return $query->latest()->get();
    }

    /**
     * Preview calculation for contract.
     */
    public function preview(Request $request)
    {
        $request->validate([
            'total_price' => 'required|numeric',
            'down_payment' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase,rental',
            'balloon_percent' => 'nullable|numeric|min:0|max:100', // % of principal for balloon
        ]);

        $preview = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $request->contract_type ?? 'installment',
            $request->balloon_percent ?? 0
        );

        return response()->json($preview);
    }

    private function calculateSchedule($total, $down, $rate, $months, $startDate, $contractType = 'installment', $balloonPercent = 0)
    {
        if ($contractType === 'rental') {
            // For Rental:
            // $total = Monthly Rent (Input)
            // $down = Security Deposit (Separate, not deducted)
            $installmentAmount = $total;
            $principal = $total * $months; // Total contract value
            $financedPrincipal = $principal;
            $interestTotal = 0;
            $balloonPayment = 0;
            $totalWithInterest = $principal;
        } else {
            // For Installment / Hire Purchase
            $principal = $total - $down;

            // For hire_purchase, calculate balloon payment (ยอดกู้ธนาคาร)
            $balloonPayment = 0;
            $financedPrincipal = $principal;

            if ($contractType === 'hire_purchase' && $balloonPercent > 0) {
                $balloonPayment = $principal * ($balloonPercent / 100);
                $financedPrincipal = $principal - $balloonPayment; // ส่วนที่ผ่อนกับเจ้าของ
            }

            // Simple Interest Formula: Interest = Principal * Rate * Time
            // Rate is percentage per year
            $interestTotal = $financedPrincipal * ($rate / 100) * ($months / 12);

            $totalWithInterest = $financedPrincipal + $interestTotal;
            $installmentAmount = ceil($totalWithInterest / $months); // Round up
        }

        $schedule = [];
        $date = Carbon::parse($startDate);

        for ($i = 1; $i <= $months; $i++) {
            $dueDate = $date->copy()->addMonths($i);

            $schedule[] = [
                'installment_number' => $i,
                'due_date' => $dueDate->format('Y-m-d'),
                'amount_due' => $installmentAmount,
            ];
        }

        // Calculate end date
        $endDate = $date->copy()->addMonths($months)->format('Y-m-d');

        return [
            'total_price' => $total,
            'down_payment' => $down,
            'principal' => $principal,
            'financed_principal' => $financedPrincipal,
            'interest_total' => round($interestTotal, 2),
            'total_payable' => round($totalWithInterest, 2),
            'installment_amount' => $installmentAmount,
            'balloon_payment' => round($balloonPayment, 2),
            'end_date' => $endDate,
            'schedule' => $schedule,
        ];
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'asset_id' => 'required|exists:assets,id',
            'contract_number' => 'required|string|unique:contracts,contract_number',
            'total_price' => 'required|numeric',
            'down_payment' => 'required|numeric',
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase,rental',
            'balloon_percent' => 'nullable|numeric',
            'witness1_name' => 'nullable|string',
            'witness2_name' => 'nullable|string',
            'main_contract' => 'nullable|file|mimes:pdf|max:10240', // Max 10MB
            'attachments.*' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $contractType = $request->contract_type ?? 'installment';
        $balloonPercent = $request->balloon_percent ?? 0;

        $calc = $this->calculateSchedule(
            $request->total_price,
            $request->down_payment,
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $contractType,
            $balloonPercent
        );

        DB::beginTransaction();
        try {
            $contract = $request->user()->contracts()->create([
                'customer_id' => $request->customer_id,
                'asset_id' => $request->asset_id,
                'contract_number' => $request->contract_number,
                'type' => $request->type ?? 'hire_purchase',
                'contract_type' => $contractType,
                'total_price' => $request->total_price,
                'down_payment' => $request->down_payment,
                'principal_amount' => $calc['principal'],
                'interest_rate' => $request->interest_rate,
                'installments_count' => $request->installments_count,
                'installment_amount' => $calc['installment_amount'],
                'balloon_payment' => $calc['balloon_payment'],
                'start_date' => $request->start_date,
                'end_date' => $calc['end_date'],
                'original_end_date' => $calc['end_date'],
                'status' => 'pending_signature',
                'witness1_name' => $request->witness1_name,
                'witness2_name' => $request->witness2_name,
            ]);

            // Handle Main Contract PDF
            if ($request->hasFile('main_contract')) {
                $file = $request->file('main_contract');
                $path = $file->store('contracts/external', 'public');
                
                $contract->documents()->create([
                    'type' => 'main_contract',
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'file_type' => 'pdf',
                ]);
                
                // Update specific column for quick access if needed, or rely on relationship
                 $contract->update(['external_contract_path' => $path]);
            }

            // Handle Attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $mime = $file->getMimeType();
                    $isImage = strpos($mime, 'image/') !== false;
                    $fileType = $isImage ? 'image' : 'pdf';
                    
                    if ($isImage) {
                        $path = $this->resizeAndSaveImage($file, 'contracts/attachments');
                    } else {
                        $path = $file->store('contracts/attachments', 'public');
                    }

                    $contract->documents()->create([
                        'type' => 'attachment',
                        'file_path' => $path,
                        'original_name' => $file->getClientOriginalName(),
                        'file_type' => $fileType,
                    ]);
                }
            }

            // Create Installments
            foreach ($calc['schedule'] as $inst) {
                $contract->installments()->create([
                    'due_date' => $inst['due_date'],
                    'amount' => $inst['amount_due'],
                    'status' => 'pending',
                ]);
            }

            // Update Asset status
            $contract->asset()->update(['status' => 'leased']);

            DB::commit();

            return response()->json($contract->load('installments', 'documents'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create contract: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $contract->load('installments', 'customer', 'asset', 'receipts', 'documents');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Contract $contract)
    {
        // Typically strict on updates, maybe specific fields only
        return response()->json(['message' => 'Not implemented fully yet'], 501);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $contract->delete();
        return response()->json(['message' => 'Contract deleted']);
    }
    public function getPdfUrl(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Generate a temporary signed URL valid for 5 minutes
        $url = URL::temporarySignedRoute(
            'contracts.pdf.stream',
            now()->addMinutes(5),
            ['contract' => $contract->id]
        );

        return response()->json(['url' => $url]);
    }

    public function streamPdf(Request $request, Contract $contract)
    {
        // Valid Signature Check is handled by middleware 'signed' in routes
        if (!$request->hasValidSignature()) {
            abort(403, 'Invalid or expired signature');
        }

        $contract->load('customer', 'asset', 'installments', 'owner');
        \Carbon\Carbon::setLocale('th');

        // Check if external PDF exists
        if ($contract->external_contract_path && Storage::disk('public')->exists($contract->external_contract_path)) {
            
            // 1. Generate Suffix PDF (Schedule + Signatures)
            $pdf = PDF::loadView('pdfs.contract', ['contract' => $contract, 'onlySuffix' => true]);
            $pdf->setPaper('a4', 'portrait');
            $suffixContent = $pdf->output();

            // 2. Merge using FPDI
            $pdfMerger = new \setasign\Fpdi\Fpdi();
            
            // Import External PDF - decompress with qpdf first for FPDI compatibility
            $externalPath = Storage::disk('public')->path($contract->external_contract_path);
            
            // Use qpdf to decompress the PDF (FPDI free parser can't handle compressed PDFs)
            $decompressedPath = tempnam(sys_get_temp_dir(), 'qpdf_');
            $qpdfCmd = "qpdf --stream-data=uncompress " . escapeshellarg($externalPath) . " " . escapeshellarg($decompressedPath) . " 2>&1";
            exec($qpdfCmd, $output, $returnCode);
            
            // Use decompressed file if qpdf succeeded, otherwise try original
            $pdfToImport = ($returnCode === 0) ? $decompressedPath : $externalPath;
            
            try {
                $pageCount = $pdfMerger->setSourceFile($pdfToImport);
                for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                    $templateId = $pdfMerger->importPage($pageNo);
                    $pdfMerger->AddPage();
                    $pdfMerger->useTemplate($templateId, ['adjustPageSize' => true]);
                }

                // Import Suffix PDF
                $tmpFile = tempnam(sys_get_temp_dir(), 'suffix_pdf');
                file_put_contents($tmpFile, $suffixContent);

                $pageCount = $pdfMerger->setSourceFile($tmpFile);
                for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                    $templateId = $pdfMerger->importPage($pageNo);
                    $pdfMerger->AddPage();
                    $pdfMerger->useTemplate($templateId, ['adjustPageSize' => true]);
                }

                unlink($tmpFile);
                if (file_exists($decompressedPath)) unlink($decompressedPath);

                return response($pdfMerger->Output('S'), 200)
                    ->header('Content-Type', 'application/pdf')
                    ->header('Content-Disposition', 'inline; filename="contract-' . $contract->contract_number . '.pdf"');
                    
            } catch (\Exception $e) {
                // Fallback: if merge fails, just generate the full PDF from Blade
                if (file_exists($decompressedPath)) unlink($decompressedPath);
                
                $pdf = PDF::loadView('pdfs.contract', ['contract' => $contract, 'onlySuffix' => false]);
                $pdf->setPaper('a4', 'portrait');
                return $pdf->stream('contract-' . $contract->contract_number . '.pdf');
            }

        } else {
            // Normal behavior - Full generation
            $pdf = PDF::loadView('pdfs.contract', ['contract' => $contract, 'onlySuffix' => false]);
            $pdf->setPaper('a4', 'portrait');
            return $pdf->stream('contract-' . $contract->contract_number . '.pdf');
        }
    }

    public function sign(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'signature' => 'required|string',
            'type' => 'required|in:owner,customer,witness1,witness2',
        ]);

        try {
            $image = $request->signature;
            // Handle data URI scheme
            if (preg_match('/^data:image\/(\w+);base64,/', $image, $type)) {
                $image = substr($image, strpos($image, ',') + 1);
                $ext = strtolower($type[1]); // jpg, png, gif

                if (!in_array($ext, ['jpg', 'jpeg', 'gif', 'png'])) {
                    throw new \Exception('invalid image type');
                }
                $image = str_replace(' ', '+', $image);
                $image = base64_decode($image);

                if ($image === false) {
                    throw new \Exception('base64_decode failed');
                }
            } else {
                throw new \Exception('did not match data URI with image data');
            }

            // Use Intervention Image to resize/optimize signature
            $filename = 'signatures/' . $contract->id . '_' . $request->type . '_' . Str::random(10) . '.jpg';
            
            $img = Image::make($image);
            // Resize if too large (e.g. width > 600)
            if ($img->width() > 600) {
                 $img->resize(600, null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
            }
            $encoded = $img->encode('jpg', 80);
            Storage::disk('public')->put($filename, (string) $encoded);
            $imageName = $filename;

            // Update specific signature column
            $userType = $request->type;
            if ($userType === 'owner') {
                if ($contract->owner_signature_path) Storage::disk('public')->delete($contract->owner_signature_path);
                $contract->owner_signature_path = $imageName;
            } elseif ($userType === 'customer') {
                if ($contract->customer_signature_path) Storage::disk('public')->delete($contract->customer_signature_path);
                $contract->customer_signature_path = $imageName;
            } elseif ($userType === 'witness1') {
                if ($contract->witness1_signature_path) Storage::disk('public')->delete($contract->witness1_signature_path);
                $contract->witness1_signature_path = $imageName;
            } elseif ($userType === 'witness2') {
                if ($contract->witness2_signature_path) Storage::disk('public')->delete($contract->witness2_signature_path);
                $contract->witness2_signature_path = $imageName;
            }

            $contract->save();

            // REMOVED AUTO-ACTIVATE LOGIC

            return response()->json([
                'message' => 'Signature saved successfully',
                'path' => $imageName,
                'status' => $contract->status,
                'owner_signed' => !!$contract->owner_signature_path,
                'customer_signed' => !!$contract->customer_signature_path,
                'witness1_signed' => !!$contract->witness1_signature_path,
                'witness2_signed' => !!$contract->witness2_signature_path
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to save signature: ' . $e->getMessage()], 500);
        }
    }

    public function activate(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($contract->status === 'active') {
             return response()->json(['message' => 'Contract is already active'], 400);
        }

        // Optional: Enforcement logic (e.g. require owner & customer signatures)
        if (!$contract->owner_signature_path || !$contract->customer_signature_path) {
            return response()->json(['message' => 'Owner and Customer signatures are required to activate.'], 400);
        }

        $contract->status = 'active';
        $contract->save();

        return response()->json(['message' => 'Contract activated successfully', 'status' => 'active']);
    }

    public function cancel(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string',
        ]);

        if ($contract->status === 'cancelled') {
            return response()->json(['message' => 'Contract is already cancelled'], 400);
        }

        DB::beginTransaction();
        try {
            // 1. Log cancellation
            DB::table('contract_cancellations')->insert([
                'contract_id' => $contract->id,
                'cancelled_by' => $request->user()->id,
                'reason' => $request->reason,
                'cancelled_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Update Contract status
            $contract->update(['status' => 'cancelled']);

            // 3. Update Asset status to available
            $contract->asset()->update(['status' => 'available']);

            DB::commit();

            return response()->json(['message' => 'Contract cancelled successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to cancel contract: ' . $e->getMessage()], 500);
        }
    }

    public function renew(Request $request, Contract $contract)
    {
        if ($request->user()->id !== $contract->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'total_price' => 'required|numeric', // This should be the balloon amount
            'interest_rate' => 'required|numeric',
            'installments_count' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'contract_type' => 'nullable|in:installment,hire_purchase',
            'balloon_percent' => 'nullable|numeric|min:0|max:100',
        ]);

        $contractType = $request->contract_type ?? 'installment';
        $balloonPercent = $request->balloon_percent ?? 0;

        // Calculate Schedule for New Contract
        $calc = $this->calculateSchedule(
            $request->total_price,
            0, // No down payment for renewal essentially
            $request->interest_rate,
            $request->installments_count,
            $request->start_date,
            $contractType,
            $balloonPercent
        );

        DB::beginTransaction();
        try {
            // 1. Close Old Contract
            $contract->update(['status' => 'closed']);

            // 2. Create New Contract
            $newContract = $request->user()->contracts()->create([
                'customer_id' => $contract->customer_id,
                'asset_id' => $contract->asset_id,
                'contract_number' => 'RN-' . $contract->contract_number . '-' . Carbon::now()->timestamp, // Generate new number
                'type' => $contract->type,
                'contract_type' => $contractType,
                'total_price' => $request->total_price,
                'down_payment' => 0, // No down payment for renewal essentially
                'principal_amount' => $calc['principal'],
                'interest_rate' => $request->interest_rate,
                'installments_count' => $request->installments_count,
                'installment_amount' => $calc['installment_amount'],
                'balloon_payment' => $calc['balloon_payment'],
                'start_date' => $request->start_date,
                'end_date' => $calc['end_date'],
                'original_end_date' => $calc['end_date'],
                'parent_contract_id' => $contract->id,
                'status' => 'active',
                // signature_path is intentionally left null (new contract needs signing)
            ]);

            // 3. Create Installments for New Contract
            foreach ($calc['schedule'] as $inst) {
                $newContract->installments()->create([
                    'due_date' => $inst['due_date'],
                    'amount' => $inst['amount_due'],
                    'status' => 'pending',
                ]);
            }

            // Asset status remains 'leased' (or similar), no change needed if already leased.

            DB::commit();

            return response()->json([
                'message' => 'Contract renewed successfully',
                'new_contract_id' => $newContract->id,
                'new_contract' => $newContract
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to renew contract: ' . $e->getMessage()], 500);
        }
    }
    public function uploadDocument(Request $request, $id)
    {
        $contract = Contract::findOrFail($id);

        if ($contract->status === 'active' || $contract->status === 'completed' || $contract->status === 'cancelled') {
             // For now, allow uploads even if active, but maybe restrict main_contract replacement?
             // User requested: "ถ้ากดยืนยันสัญญาแล้ว จะสามารถเรียกดูได้อย่างเดียวไม่สามารถเพิ่ม / ลบ ได้"
             // "If confirmed (active?), can only view, cannot add/delete"
             if ($contract->status !== 'pending' && $contract->status !== 'draft' && $contract->status !== 'pending_signature') {
                 return response()->json(['message' => 'Cannot modify documents for active/completed contracts'], 403);
             }
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB
            'type' => 'required|in:main_contract,attachment',
        ]);

        $file = $request->file('file');
        $type = $request->input('type');

        // If main_contract, checking if one already exists? 
        // Logic says we should replace or error. Let's replace for now or just add as new version?
        // The previous logic in store() implies one main_contract. 
        if ($type === 'main_contract') {
             // Logic to handle main contract replacement if needed, 
             // but for simplicity, let's just upload it. 
             // Ideally we should delete old main_contract if exists?
        }

        $pathPrefix = 'contract_docs/' . $contract->id;
        $filePath = '';
        $fileType = 'pdf';

        if ($file->getMimeType() === 'application/pdf') {
            $filePath = $file->store($pathPrefix, 'public');
        } else {
            // It's an image, resize it
            $filePath = $this->resizeAndSaveImage($file, $pathPrefix);
            $fileType = 'image';
        }

        $document = $contract->documents()->create([
            'type' => $type,
            'file_path' => $filePath,
            'original_name' => $file->getClientOriginalName(),
            'file_type' => $fileType,
        ]);

        // If it's main contract, update the contract's external_contract_path too?
        if ($type === 'main_contract') {
            $contract->external_contract_path = $filePath;
            $contract->save();
        }

        return response()->json($document);
    }

    public function deleteDocument($id, $documentId)
    {
        $contract = Contract::findOrFail($id);

        // Check status
        if ($contract->status !== 'pending' && $contract->status !== 'draft' && $contract->status !== 'pending_signature') {
            return response()->json(['message' => 'Cannot delete documents for active/completed contracts'], 403);
        }

        $document = $contract->documents()->findOrFail($documentId);

        // Delete file from storage
        Storage::disk('public')->delete($document->file_path);

        // If it was the main contract, clear the field in contracts table
        if ($document->type === 'main_contract') {
            $contract->external_contract_path = null;
            $contract->save();
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted']);
    }
}
