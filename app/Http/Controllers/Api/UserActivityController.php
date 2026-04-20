<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Review;
use Illuminate\Support\Facades\Storage;

class UserActivityController extends Controller
{
    /**
     * Get all active orders grouped by status
     */
    public function orders(Request $request)
    {
        $user = $request->user();
        
        $orders = Order::with(['items', 'shop'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $grouped = [
            'pending' => [],     // Belum Bayar
            'processing' => [],  // Dikemas
            'shipped' => [],     // Dikirim
            'completed' => []    // Selesai / Penilaian
        ];

        foreach ($orders as $order) {
            $status = $order->status;
            if (isset($grouped[$status])) {
                $grouped[$status][] = $order;
            } else {
                $grouped['pending'][] = $order; // fallback
            }
        }

        return response()->json($grouped);
    }

    /**
     * Mark an order as received/completed
     */
    public function receive(Request $request, $id)
    {
        $user = $request->user();
        
        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($order->status !== 'completed') {
            $order->status = 'completed';
            $order->save();
        }

        return response()->json(['message' => 'Pesanan telah diterima', 'order' => $order]);
    }

    /**
     * Submit a review for a specific product within an order
     */
    public function storeReview(Request $request, $id)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);

        $user = $request->user();
        
        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->firstOrFail();
            
        $review = Review::updateOrCreate(
            ['user_id' => $user->id, 'order_id' => $order->id, 'product_id' => $request->product_id],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        return response()->json(['message' => 'Penilaian berhasil disimpan!', 'review' => $review]);
    }

    /**
     * Cancel a pending order, restock products and restore voucher
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        
        $order = Order::with(['items'])->where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        // Cari semua order yang berasal dari checkout yang sama (berdasarkan snap_token)
        if ($order->snap_token) {
            $relatedOrders = Order::with(['items'])
                ->where('snap_token', $order->snap_token)
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->get();
        } else {
            $relatedOrders = collect([$order]);
        }

        \DB::beginTransaction();
        try {
            foreach ($relatedOrders as $ro) {
                // 1. Restock Products
                foreach ($ro->items as $item) {
                    if ($item->variant_id) {
                        $variant = \App\Models\ProductVariant::find($item->variant_id);
                        if ($variant) {
                            $variant->increment('stok', $item->qty);
                        }
                    } else {
                        $product = \App\Models\Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stok', $item->qty);
                        }
                    }
                }

                // 2. Restore Voucher if any
                if ($ro->voucher_code) {
                    // Cek agar restore voucher tidak redundan jika kode voucher sama
                    // (Asumsikan voucher di-generate per-toko atau global tapi kuota telah dikurangi)
                    $voucher = \App\Models\Voucher::where('code', $ro->voucher_code)->first();
                    if ($voucher) {
                        $voucher->increment('kuota', 1);
                    }
                }

                // 3. Update Status
                $ro->status = 'cancelled';
                $ro->save();
            }

            \DB::commit();
            return response()->json(['message' => 'Pesanan berhasil dibatalkan dan stok telah dikembalikan.']);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()], 500);
        }
    }
}
