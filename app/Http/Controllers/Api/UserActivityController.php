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
        
        $orders = Order::with(['items.product', 'items.variant', 'items.review', 'shop'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $grouped = [
            'pending' => [],     // Belum Bayar
            'processing' => [],  // Dikemas & Proses Gudang
            'shipped' => [],     // Kurir Mengantar
            'completed' => []    // Selesai / Penilaian
        ];

        foreach ($orders as $order) {
            $status = $order->status;
            
            if ($status === 'pending') {
                $grouped['pending'][] = $order;
            } elseif (in_array($status, ['processing', 'ready_for_pickup', 'picking_up', 'at_logistics'])) {
                $grouped['processing'][] = $order;
            } elseif (in_array($status, ['delivering', 'delivered'])) {
                $grouped['shipped'][] = $order;
            } elseif (in_array($status, ['completed', 'failed_delivery', 'cancelled'])) {
                $grouped['completed'][] = $order;
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
            'comment' => 'nullable|string|max:1000',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'courier_rating' => 'nullable|integer|min:1|max:5',
            'courier_comment' => 'nullable|string|max:500'
        ]);

        $user = $request->user();
        
        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->firstOrFail();
            
        // Handle existing images if editing
        $existingReview = Review::where(['user_id' => $user->id, 'order_id' => $order->id, 'product_id' => $request->product_id])->first();
        $imagePaths = $existingReview ? ($existingReview->images ?? []) : [];

        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('reviews', 'public');
                $imagePaths[] = $path;
            }
        }

        $reviewData = [
            'rating' => $request->rating, 
            'comment' => $request->comment,
            'images' => $imagePaths,
            'courier_rating' => $request->courier_rating,
            'courier_comment' => $request->courier_comment
        ];

        $review = Review::updateOrCreate(
            ['user_id' => $user->id, 'order_id' => $order->id, 'product_id' => $request->product_id],
            $reviewData
        );

        // Update Courier Performance Rating if provided
        if ($request->filled('courier_rating') && $order->delivery_courier_id) {
            $courier = \App\Models\User::find($order->delivery_courier_id);
            if ($courier) {
                // Get all reviews for orders delivered by this courier
                $allCourierRatings = Review::whereHas('order', function($q) use ($courier) {
                    $q->where('delivery_courier_id', $courier->id);
                })->whereNotNull('courier_rating')->pluck('courier_rating');

                $count = $allCourierRatings->count();
                $avg = $allCourierRatings->avg();

                $courier->update([
                    'rating' => $avg ?? 5.0,
                    'rating_count' => $count
                ]);
            }
        }

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
            $restoredVouchers = [];
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

                // 2. Restore Voucher if any (Ensure only once per voucher code in the session)
                if ($ro->voucher_code && !in_array($ro->voucher_code, $restoredVouchers)) {
                    $voucher = \App\Models\Voucher::where('code', $ro->voucher_code)->first();
                    if ($voucher) {
                        $voucher->increment('kuota', 1);
                        $restoredVouchers[] = $ro->voucher_code;
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
