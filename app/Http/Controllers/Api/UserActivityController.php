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
        
        // Verify order belongs to user and is completed
        $order = Order::where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->firstOrFail();
            
        // Validasi apakah produk ada di dalam order_items ini dan sudah/belum di review? 
        // Untuk penyederhanaan cepat, kita izinkan multiple reviews tapi update jika udah ada (opsional).
        $review = Review::updateOrCreate(
            ['user_id' => $user->id, 'order_id' => $order->id, 'product_id' => $request->product_id],
            ['rating' => $request->rating, 'comment' => $request->comment]
        );

        return response()->json(['message' => 'Penilaian berhasil disimpan!', 'review' => $review]);
    }
}
