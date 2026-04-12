<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;

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
}
