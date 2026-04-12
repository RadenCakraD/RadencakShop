<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Order;

class CheckoutController extends Controller
{
    public function process(Request $request)
    {
        $request->validate([
            'cart_ids' => 'required|array',
            'cart_ids.*' => 'exists:carts,id',
            'address_info' => 'nullable|string',
            'payment_method' => 'string',
            'shipping_method' => 'string'
        ]);

        $user = $request->user();
        $carts = \App\Models\Cart::with(['product.shop', 'variant'])
            ->whereIn('id', $request->cart_ids)
            ->where('user_id', $user->id)
            ->get();

        if ($carts->isEmpty()) {
            return response()->json(['message' => 'Keranjang kosong atau tidak valid'], 400);
        }

        // Group by Shop ID because one order per shop is common in marketplaces
        $grouped = $carts->groupBy(function($item) {
            return $item->product->shop_id;
        });

        $orders = [];
        \DB::beginTransaction();
        try {
            foreach ($grouped as $shopId => $cartItems) {
                $totalAmount = 0;
                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    $totalAmount += $price * $item->qty;
                }

                $totalAmount += 500; // Sinkronisasi biaya layanan dengan UI Pembayaran.js

                $order = \App\Models\Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'order_number' => 'ORD-' . strtoupper(Str::random(10)),
                    'status' => 'pending',
                    'total_amount' => $totalAmount,
                    'address_info' => $request->address_info ?? 'Alamat Default User',
                    'payment_method' => $request->payment_method ?? 'Transfer Bank',
                    'shipping_method' => $request->shipping_method ?? 'Reguler',
                ]);

                foreach ($cartItems as $item) {
                    $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
                    
                    \App\Models\OrderItem::create([
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
                        $variantDb = \App\Models\ProductVariant::where('id', $item->variant->id)->lockForUpdate()->first();
                        if (!$variantDb || $variantDb->stok < $item->qty) {
                            throw new \Exception("Stok varian produk {$item->product->nama_produk} tidak mencukupi.");
                        }
                        $variantDb->decrement('stok', $item->qty);
                    } else {
                        $productDb = \App\Models\Product::where('id', $item->product->id)->lockForUpdate()->first();
                        if (!$productDb || $productDb->stok < $item->qty) {
                            throw new \Exception("Stok produk {$item->product->nama_produk} tidak mencukupi.");
                        }
                        $productDb->decrement('stok', $item->qty);
                    }

                    // Delete cart item
                    $item->delete();
                }

                $orders[] = $order;
            }

            \DB::commit();
            return response()->json([
                'message' => 'Checkout Berhasil!',
                'orders' => $orders
            ], 201);

        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json(['message' => 'Gagal checkout: ' . $e->getMessage()], 500);
        }
    }
}
