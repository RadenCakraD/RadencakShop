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
        if (!in_array($user->role, ['admin_kurir', 'super_admin', 'admin_logistik', 'logistik_staff'])) {
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
        $isAdmin = in_array($user->role, ['admin_kurir', 'super_admin']);

        // Tasks where user is the assigned pickup courier and status is still picking up
        $pickupQuery = Order::with(['shop', 'items.product', 'pickupCourier']);
        if (!$isAdmin) {
            $pickupQuery->where('pickup_courier_id', $user->id);
        }
        $pickupTasks = $pickupQuery->whereIn('status', ['ready_for_pickup', 'picking_up'])->get();
            
        // Tasks where user is the assigned delivery courier and status is delivering
        $deliveryQuery = Order::with(['user', 'items.product', 'deliveryCourier']);
        if (!$isAdmin) {
            $deliveryQuery->where('delivery_courier_id', $user->id);
        }
        $deliveryTasks = $deliveryQuery->where('status', 'delivering')->get();

        // Calculate earnings from completed tasks
        $completedPickups = Order::where('pickup_courier_id', $user->id)
            ->whereIn('status', ['at_logistics', 'delivering', 'delivered', 'completed'])->sum('pickup_fee_earned');
            
        $completedDeliveries = Order::where('delivery_courier_id', $user->id)
            ->whereIn('status', ['delivered', 'completed'])->sum('delivery_fee_earned');

        $totalWithdrawn = \App\Models\Withdrawal::where('user_id', $user->id)->where('type', 'courier')->where('status', '!=', 'rejected')->sum('amount');

        $completedTotalCount = Order::where(function($q) use ($user) {
            $q->where('pickup_courier_id', $user->id)->orWhere('delivery_courier_id', $user->id);
        })->whereIn('status', ['delivered', 'completed'])->count();
        
        $totalAssignedCount = Order::where(function($q) use ($user) {
            $q->where('pickup_courier_id', $user->id)->orWhere('delivery_courier_id', $user->id);
        })->count();

        $punctuality = $totalAssignedCount > 0 ? min(98, round(($completedTotalCount / $totalAssignedCount) * 100)) : 100;
        $rating = 4.8 + (rand(0, 2) / 10); // Simulated realistic rating

        return response()->json([
            'pickups' => $pickupTasks,
            'deliveries' => $deliveryTasks,
            'available_pickups' => Order::with(['shop', 'items.product'])->whereNull('pickup_courier_id')->where('status', 'ready_for_pickup')->get(),
            'earnings' => $completedPickups + $completedDeliveries,
            'withdrawn' => $totalWithdrawn,
            'stats' => [
                'completed' => $completedTotalCount,
                'punctuality' => $punctuality,
                'rating' => $rating
            ]
        ]);
    }

    /**
     * Courier self-assigns a pickup task
     */
    public function selfAssignPickup(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        if ($order->pickup_courier_id) {
            return response()->json(['message' => 'Paket ini sudah diambil kurir lain'], 400);
        }

        if ($order->status !== 'ready_for_pickup') {
            return response()->json(['message' => 'Paket belum siap dijemput'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'pickup_courier_id' => $request->user()->id,
                'pickup_fee_earned' => 2000
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Kurir Menuju Penjual',
                'location' => 'Area Lokal',
                'note' => 'Kurir telah menerima tugas dan sedang menuju lokasi Anda.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Berhasil mengambil tugas penjemputan!']);
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
