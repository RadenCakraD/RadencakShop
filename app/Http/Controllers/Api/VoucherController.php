<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Voucher;

class VoucherController extends Controller
{
    private function isAdmin($user) {
        return $user && $user->role === 'admin';
    }

    public function index(Request $request)
    {
        $user = $request->user();
        if ($this->isAdmin($user)) {
            // Admin gets global vouchers
            $vouchers = Voucher::whereNull('shop_id')->orderBy('created_at', 'desc')->get();
        } else if ($user->shop) {
            // Shop owner gets their shop vouchers
            $vouchers = Voucher::where('shop_id', $user->shop->id)->orderBy('created_at', 'desc')->get();
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($vouchers);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'nama_voucher' => 'required|string|max:255',
            'code' => 'required|string|unique:vouchers,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_purchase' => 'required|numeric|min:0',
            'valid_until' => 'required|date',
            'kuota' => 'required|integer|min:0',
        ]);

        $shopId = null;
        if (!$this->isAdmin($user)) {
            if (!$user->shop) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $shopId = $user->shop->id;
        }

        $voucher = Voucher::create([
            'shop_id' => $shopId,
            'nama_voucher' => $request->nama_voucher,
            'code' => strtoupper($request->code),
            'type' => $request->type,
            'value' => $request->value,
            'min_purchase' => $request->min_purchase,
            'valid_until' => $request->valid_until,
            'kuota' => $request->kuota,
        ]);

        return response()->json(['message' => 'Voucher berhasil dibuat', 'voucher' => $voucher], 201);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $voucher = Voucher::findOrFail($id);

        if (!$this->isAdmin($user) && (!$user->shop || $voucher->shop_id !== $user->shop->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $voucher->delete();
        return response()->json(['message' => 'Voucher berhasil dihapus']);
    }

    public function check(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'total_amount' => 'required|numeric',
            'shop_id' => 'required|numeric'
        ]);

        $voucher = Voucher::where('code', $request->code)->first();

        if (!$voucher) {
            return response()->json(['message' => 'Kode voucher tidak valid'], 404);
        }

        if (now()->greaterThanOrEqualTo($voucher->valid_until)) {
            return response()->json(['message' => 'Kode voucher telah kedaluwarsa'], 400);
        }

        if ($voucher->kuota <= 0) {
            return response()->json(['message' => 'Kuota voucher telah habis'], 400);
        }

        if ($request->total_amount < $voucher->min_purchase) {
            return response()->json(['message' => 'Minimum belanja tidak terpenuhi (Min. Rp ' . number_format($voucher->min_purchase, 0, ',', '.') . ')'], 400);
        }

        if ($voucher->shop_id !== null && $voucher->shop_id != $request->shop_id) {
            return response()->json(['message' => 'Voucher ini tidak berlaku untuk produk di toko ini'], 400);
        }

        $discountValue = 0;
        if ($voucher->type === 'percentage') {
            $discountValue = ($voucher->value / 100) * $request->total_amount;
            // Prevent discount from exceeding total amount
            if ($discountValue > $request->total_amount) {
                $discountValue = $request->total_amount;
            }
        } else {
            $discountValue = collect([$voucher->value, $request->total_amount])->min();
        }

        return response()->json([
            'message' => 'Voucher berhasil diterapkan',
            'voucher' => $voucher,
            'discount_amount' => $discountValue
        ]);
    }
}
