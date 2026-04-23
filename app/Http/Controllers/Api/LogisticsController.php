<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderTracking;
use Illuminate\Support\Facades\DB;

class LogisticsController extends Controller
{
    /**
     * Get logistics stats and recent tracks
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin_logistik' && $user->role !== 'logistik_staff' && $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $totalInDelivery = Order::where('status', 'delivering')->count();
        $totalProcessing = Order::whereIn('status', ['picking_up', 'at_logistics', 'ready_for_pickup'])->count();
        $totalDelivered = Order::whereIn('status', ['delivered', 'completed'])->count();

        $recentTracks = OrderTracking::with('order')->latest()->take(10)->get();

        return response()->json([
            'total_in_delivery' => $totalInDelivery,
            'total_processing' => $totalProcessing,
            'total_delivered' => $totalDelivered,
            'recent_tracks' => $recentTracks
        ]);
    }

    /**
     * Get pending packages mapping
     */
    public function getPackages(Request $request)
    {
        // Packages coming from Courier into Warehouse
        $incoming = Order::with('pickupCourier')->where('status', 'picking_up')->get();
        // Packages at Warehouse waiting to be assigned
        $atWarehouse = Order::with('pickupCourier')->where('status', 'at_logistics')->get();
        // Packages assigned for delivery
        $delivering = Order::with('deliveryCourier')->where('status', 'delivering')->get();

        return response()->json([
            'incoming' => $incoming,
            'at_warehouse' => $atWarehouse,
            'delivering' => $delivering
        ]);
    }

    /**
     * Scan / Receive package into logistics warehouse
     */
    public function receivePackage(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        if ($order->status !== 'picking_up') {
            return response()->json(['message' => 'Paket belum di-pickup oleh kurir atau status tidak valid.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'at_logistics',
                'logistics_id' => $request->user()->id
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Di Gudang Logistik',
                'location' => 'Pusat Sortir (Logistik)',
                'note' => 'Paket telah diterima di gudang sentral dan sedang disortir.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Paket berhasil diterima di Logistik.']);
    }

    /**
     * Assign package to delivery courier
     */
    public function assignDelivery(Request $request, $orderId)
    {
        $request->validate([
            'delivery_courier_id' => 'required|exists:users,id'
        ]);

        $order = Order::findOrFail($orderId);
        
        if ($order->status !== 'at_logistics') {
            return response()->json(['message' => 'Hanya paket yang berada di gudang yang bisa di-assign.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'delivering',
                'delivery_courier_id' => $request->delivery_courier_id,
                'delivery_fee_earned' => 2000 // Tarif Antar tetap
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Kurir Menuju Lokasi Anda',
                'location' => 'Keluar dari Gudang',
                'note' => 'Paket telah diserahkan kepada kurir pengantar.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Penugasan pengantaran berhasil.']);
    }
}
