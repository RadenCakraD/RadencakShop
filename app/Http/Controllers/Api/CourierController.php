<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\User;
use App\Models\OrderTracking;
use Illuminate\Support\Facades\DB;

class CourierController extends Controller
{
    /**
     * Get all couriers for admin_kurir
     */
    public function getStaffs(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin_kurir' && $user->role !== 'super_admin' && $user->role !== 'admin_logistik') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $couriers = User::where('role', 'kurir_staff')->get();
        return response()->json($couriers);
    }

    /**
     * Get tasks for courier staff
     */
    public function getMyTasks(Request $request)
    {
        $user = $request->user();

        // Tasks where user is the assigned pickup courier and status is still picking up
        $pickupTasks = Order::with(['shop', 'items.product'])->where('pickup_courier_id', $user->id)
            ->whereIn('status', ['ready_for_pickup', 'picking_up'])->get();
            
        // Tasks where user is the assigned delivery courier and status is delivering
        $deliveryTasks = Order::with(['user', 'items.product'])->where('delivery_courier_id', $user->id)
            ->where('status', 'delivering')->get();

        // Calculate earnings from completed tasks
        $completedPickups = Order::where('pickup_courier_id', $user->id)
            ->whereIn('status', ['at_logistics', 'delivering', 'delivered', 'completed'])->sum('pickup_fee_earned');
            
        $completedDeliveries = Order::where('delivery_courier_id', $user->id)
            ->whereIn('status', ['delivered', 'completed'])->sum('delivery_fee_earned');

        $totalWithdrawn = \App\Models\Withdrawal::where('user_id', $user->id)->where('type', 'courier')->where('status', '!=', 'rejected')->sum('amount');

        return response()->json([
            'pickups' => $pickupTasks,
            'deliveries' => $deliveryTasks,
            'earnings' => $completedPickups + $completedDeliveries,
            'withdrawn' => $totalWithdrawn
        ]);
    }

    /**
     * Courier marks package as picked up from seller
     */
    public function pickupPackage(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        if ($order->pickup_courier_id != $request->user()->id) {
            return response()->json(['message' => 'Bukan tugas penjemputan Anda'], 403);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'picking_up',
                'pickup_fee_earned' => 2000
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Paket Diambil Kurir',
                'location' => 'Lokasi Penjual',
                'note' => 'Paket sedang dibawa menuju Gudang Logistik.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Status berhasil diubah menjadi Sedang Dijemput']);
    }

    /**
     * Courier marks package as delivered
     */
    public function deliverPackage(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        if ($order->delivery_courier_id != $request->user()->id) {
            return response()->json(['message' => 'Bukan tugas pengantaran Anda'], 403);
        }

        DB::transaction(function () use ($order, $request) {
            if ($request->status === 'failed_delivery') {
                $order->update(['status' => 'failed_delivery']);
                $note = $request->note ?? 'Penerima tidak dapat dihubungi atau alamat tidak valid.';
                OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Pengiriman Gagal (Retur)',
                    'location' => 'Lokasi Pembeli',
                    'note' => "RETUR: Dana dikembalikan secara otomatis. Alasan: {$note}",
                    'user_id' => $request->user()->id
                ]);
            } else {
                $order->update([
                    'status' => 'delivered',
                    'delivery_fee_earned' => 2000
                ]);
                OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Paket Telah Tiba',
                    'location' => 'Lokasi Pembeli',
                    'note' => 'Paket telah diantarkan ke tujuan tertera.',
                    'user_id' => $request->user()->id
                ]);
            }
        });

        return response()->json(['message' => 'Status pengantaran berhasil diperbarui']);
    }
    
    /**
     * Admin Kurir assigns pickup wrapper
     */
    public function assignPickup(Request $request, $orderId)
    {
        $request->validate([
            'pickup_courier_id' => 'required|exists:users,id'
        ]);

        $order = Order::findOrFail($orderId);
        
        if ($order->status !== 'ready_for_pickup') {
            return response()->json(['message' => 'Hanya paket siap jemput yang bisa di-assign'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'pickup_courier_id' => $request->pickup_courier_id,
                'pickup_fee_earned' => 2000 // Tarif Jemput
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Kurir Menuju Penjual',
                'location' => 'Area Lokal',
                'note' => 'Kurir telah ditugaskan untuk mengambil paket di toko.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Berhasil tugaskan kurir untuk penjemputan.']);
    }
}
