<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use App\Models\Order;
use App\Models\Cart;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use DB;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $request->validate([
            'cart_ids' => 'required|array',
            'cart_ids.*' => 'exists:carts,id',
            'address_info' => 'nullable|string',
            'payment_method' => 'string',
            'shipping_method' => 'string',
            'voucher_code' => 'nullable|string'
        ]);

        $user = $request->user();
        $carts = Cart::with(['product.shop', 'variant'])
            ->whereIn('id', $request->cart_ids)
            ->where('user_id', $user->id)
            ->get();

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Keranjang kosong atau tidak valid'], 400);
        }

        $grouped = $carts->groupBy(function($item) {
            return $item->product->shop_id;
        });

        $orders = [];
        $grandTotalAmount = 0;
        
        DB::beginTransaction();
        try {
            $voucher = null;
            if ($request->filled('voucher_code')) {
                $voucher = \App\Models\Voucher::where('code', $request->voucher_code)->lockForUpdate()->first();
                if ($voucher && $voucher->kuota <= 0) {
                    throw new \Exception("Kuota voucher telah habis.");
                }
            }

            foreach ($grouped as $shopId => $cartItems) {
                $totalAmount = 0;
                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    $totalAmount += $price * $item->qty;
                }

                $totalAmount += 500; // Biaya layanan

                $appliedDiscount = 0;
                $appliedVoucherCode = null;

                if ($voucher && $totalAmount >= $voucher->min_purchase) {
                    if ($voucher->shop_id === null || $voucher->shop_id == $shopId) {
                        $appliedVoucherCode = $voucher->code;
                        if ($voucher->type === 'percentage') {
                            $appliedDiscount = ($voucher->value / 100) * $totalAmount;
                            if ($appliedDiscount > $totalAmount) $appliedDiscount = $totalAmount;
                        } else {
                            $appliedDiscount = min($voucher->value, $totalAmount);
                        }
                        // For simplicity, apply the full remaining value of this specific shop or global voucher
                        // Decrement quota only once if applied
                        if ($voucher->kuota > 0) {
                            $voucher->decrement('kuota', 1);
                            $voucher = null; // So it doesn't apply to subsequent orders from other shops
                        }
                    }
                }

                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'order_number' => 'ORD-' . strtoupper(Str::random(10)),
                    'status' => 'processing',
                    'total_amount' => max(0, $totalAmount - $appliedDiscount),
                    'address_info' => $request->address_info ?? 'Alamat Default User',
                    'payment_method' => $request->payment_method ?? 'Transfer Bank',
                    'shipping_method' => $request->shipping_method ?? 'Reguler',
                    'voucher_code' => $appliedVoucherCode,
                    'discount_amount' => $appliedDiscount,
                ]);

                $grandTotalAmount += max(0, $totalAmount - $appliedDiscount);

                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item->product_id,
                        'variant_id' => $item->variant_id,
                        'product_name' => $item->product->nama_produk,
                        'variant_name' => $item->variant ? $item->variant->nama_jenis : null,
                        'price' => $price,
                        'qty' => $item->qty,
                    ]);

                    // Deduct stock safely with Pessimistic Locking
                    if ($item->variant) {
                        $variantDb = ProductVariant::where('id', $item->variant->id)->lockForUpdate()->first();
                        if (!$variantDb || $variantDb->stok < $item->qty) {
                            throw new \Exception("Stok varian produk {$item->product->nama_produk} tidak mencukupi.");
                        }
                        $variantDb->decrement('stok', $item->qty);
                    } else {
                        $productDb = Product::where('id', $item->product->id)->lockForUpdate()->first();
                        if (!$productDb || $productDb->stok < $item->qty) {
                            throw new \Exception("Stok produk {$item->product->nama_produk} tidak mencukupi.");
                        }
                        $productDb->decrement('stok', $item->qty);
                    }

                    $item->delete();
                }

                $orders[] = $order;
            }

            DB::commit();

            // Request Token Midtrans IF not Cash / COD
            $snapToken = null;
            if ($request->payment_method !== 'Cash / COD') {
                $serverKey = env('MIDTRANS_SERVER_KEY', 'SB-Mid-server-A41_8Rz1AOSa7T9m777o0Yc4'); // Dummy fallback if empty
                $midtransPayload = [
                    'transaction_details' => [
                        'order_id' => 'PAY-' . time() . '-' . Str::random(5),
                        'gross_amount' => $grandTotalAmount,
                    ],
                    'customer_details' => [
                        'first_name' => $user->username ?? $user->name,
                        'email' => $user->email,
                        'phone' => $user->no_hp ?? '',
                    ],
                ];

                $response = Http::withBasicAuth($serverKey, '')
                    ->post('https://app.sandbox.midtrans.com/snap/v1/transactions', $midtransPayload);

                $snapToken = $response->json('token');

                if ($snapToken) {
                    foreach ($orders as $o) {
                        $o->update(['snap_token' => $snapToken]);
                    }
                }
            }

            return response()->json([
                'message' => 'Checkout Berhasil!',
                'orders' => $orders,
                'snap_token' => $snapToken // Return for frontend
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Gagal checkout: ' . $e->getMessage()], 500);
        }
    }

    public function successPrototype(Request $request)
    {
        $request->validate(['snap_token' => 'required|string']);
        
        Order::where('snap_token', $request->snap_token)
             ->where('status', 'pending')
             ->update(['status' => 'processing']);
             
        return response()->json(['message' => 'Status pesanan berhasil diperbarui ke Diproses']);
    }

    public function verifyBank(Request $request)
    {
        $request->validate([
            'provider' => 'required|string',
            'account_number' => 'required|string|min:9'
        ]);

        // Simulasikan delay network bank API
        sleep(1);

        // Daftar nama awalan palsu
        $firstNames = ['BUDI', 'SITI', 'AGUS', 'SRI', 'EKO', 'RATNA', 'HENDRA', 'NUR', 'WAHYU', 'DEWI'];
        $lastNames = ['S.', 'K.', 'W.', 'P.', 'R.', 'H.', 'M.', 'L.', 'T.', 'A.'];

        // Ambil secara random atau deterministik berdasarkan angka terakhir nomor rekening
        $lastDigit = (int) substr($request->account_number, -1);
        
        $randomName = $firstNames[$lastDigit] . ' ' . $lastNames[rand(0, 9)];

        return response()->json([
            'message' => 'Rekening Terverifikasi',
            'account_name' => $randomName,
            'provider' => $request->provider,
            'account_number' => $request->account_number
        ]);
    }
}
