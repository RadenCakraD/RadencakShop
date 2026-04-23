<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\Notification;

class TrackingController extends Controller
{
    /**
     * Get Tracking info for an order
     */
    public function getTracking(Request $request, $id)
    {
        $order = Order::with('trackings')->findOrFail($id);

        if ($order->user_id !== $request->user()->id && $order->shop?->user_id !== $request->user()->id) {
            // allow logistics and courier to see? 
            if (!in_array($request->user()->role, ['super_admin', 'admin_logistik', 'logistik_staff', 'admin_kurir', 'kurir_staff'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        return response()->json([
            'order' => $order,
            'trackings' => $order->trackings
        ]);
    }

    /**
     * Notifications endpoints
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)->where('is_read', false)->count();
        return response()->json(['count' => $count]);
    }

    public function getNotifications(Request $request)
    {
        $notifs = Notification::where('user_id', $request->user()->id)->orderBy('created_at', 'desc')->take(20)->get();
        return response()->json($notifs);
    }

    public function markRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'Semua notifikasi ditandai dibaca.']);
    }
}
