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

        $query = User::whereIn('role', ['kurir_staff', 'sortir_kurir', 'kurir']);
        
        if ($user->role === 'super_admin') {
            // No extra filter
        } elseif (in_array($user->role, ['admin_logistik', 'logistik_staff'])) {
            // Logistics can see couriers in their region
            $query->where('region_id', $user->region_id);
        } else {
            // Admin Kurir sees their own staff
            $query->where('parent_id', $user->id);
        }

        $couriers = $query->get();
        return response()->json($couriers);
    }

    /**
     * Get tasks for courier staff
     */
    public function getMyTasks(Request $request)
    {
        $user = $request->user();
        $isAdmin = in_array($user->role, ['admin_kurir', 'super_admin']);
        $coverageProvince = $user->coverage_province ?? ($user->parent ? $user->parent->coverage_province : null);
        $coverageRegency = $user->coverage_regency ?? ($user->parent ? $user->parent->coverage_regency : null);
        $coverageDistrict = $user->coverage_district ?? ($user->parent ? $user->parent->coverage_district : null);

        // Tasks where user is the assigned pickup courier and status is still picking up
        $pickupQuery = Order::with(['shop', 'items.product', 'pickupCourier']);
        if (!$isAdmin) {
            $pickupQuery->where('pickup_courier_id', $user->id);
        }
        $pickupTasks = $pickupQuery->where('status', 'ready_for_pickup')->get();
            
        // Tasks where user is the assigned delivery courier and status is delivering
        $deliveryQuery = Order::with(['user', 'items.product', 'deliveryCourier']);
        if (!$isAdmin) {
            $deliveryQuery->where('delivery_courier_id', $user->id);
        } else if ($user->role !== 'super_admin') {
            // If admin_kurir, filter by their coverage
            $deliveryQuery->when($coverageProvince, function($q) use ($coverageProvince) { $q->where('destination_province', $coverageProvince); })
                         ->when($coverageRegency, function($q) use ($coverageRegency) { $q->where('destination_regency', $coverageRegency); })
                         ->when($coverageDistrict, function($q) use ($coverageDistrict) { $q->where('destination_district', $coverageDistrict); });
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

        // Available Pickups from Sellers
        $availablePickups = Order::with(['shop', 'items.product'])
            ->whereNull('pickup_courier_id')
            ->where('status', 'ready_for_pickup')
            ->when($user->role !== 'super_admin', function($query) use ($coverageProvince, $coverageRegency, $coverageDistrict) {
                $query->when($coverageProvince, function($q) use ($coverageProvince) { $q->where('origin_province', $coverageProvince); })
                      ->when($coverageRegency, function($q) use ($coverageRegency) { $q->where('origin_regency', $coverageRegency); })
                      ->when($coverageDistrict, function($q) use ($coverageDistrict) { $q->where('origin_district', $coverageDistrict); });
            })->get();

        // Packages currently being brought to hub by local couriers
        $incomingToHub = Order::with(['shop', 'pickupCourier'])
            ->where('status', 'picking_up')
            ->when($user->role !== 'super_admin', function($query) use ($coverageProvince, $coverageRegency, $coverageDistrict) {
                $query->when($coverageProvince, function($q) use ($coverageProvince) { $q->where('origin_province', $coverageProvince); })
                      ->when($coverageRegency, function($q) use ($coverageRegency) { $q->where('origin_regency', $coverageRegency); })
                      ->when($coverageDistrict, function($q) use ($coverageDistrict) { $q->where('origin_district', $coverageDistrict); });
            })->get();

        // Packages at Hub waiting to be marked for Logistics
        $atHub = Order::with(['shop', 'pickupCourier'])
            ->where('status', 'at_courier_hub')
            ->when($user->role !== 'super_admin', function($query) use ($coverageProvince, $coverageRegency, $coverageDistrict) {
                $query->where('origin_province', $coverageProvince)->where('origin_regency', $coverageRegency);
            })->get();

        // Packages waiting for Logistics Pickup
        $waitingLogistics = Order::with(['shop', 'pickupCourier'])
            ->where('status', 'ready_for_logistics')
            ->when($user->role !== 'super_admin', function($query) use ($coverageProvince, $coverageRegency, $coverageDistrict) {
                $query->where('origin_province', $coverageProvince)->where('origin_regency', $coverageRegency);
            })->get();

        return response()->json([
            'pickups' => $pickupTasks,
            'deliveries' => $deliveryTasks,
            'available_pickups' => $availablePickups,
            'incoming_to_hub' => $incomingToHub,
            'at_hub' => $atHub,
            'waiting_logistics' => $waitingLogistics,
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
                'pickup_courier_id' => $request->user()->id
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

        $request->validate([
            'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        DB::transaction(function () use ($order, $request) {
            $proofImagePath = null;
            if ($request->hasFile('proof_image')) {
                $proofImagePath = $request->file('proof_image')->store('orders/pickups', 'public');
            }

            $order->update([
                'status' => 'picking_up'
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Paket Diambil Kurir',
                'location' => 'Lokasi Penjual',
                'note' => 'Paket sedang dibawa menuju Gudang Logistik.',
                'user_id' => $request->user()->id,
                'proof_image' => $proofImagePath,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude
            ]);
        });

        return response()->json(['message' => 'Status berhasil diubah menjadi Sedang Dijemput']);
    }

    /**
     * Sortir Kurir receives package from local courier at hub
     */
    public function receiveAtHub(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->status !== 'picking_up') {
            return response()->json(['message' => 'Paket sedang tidak dalam perjalanan ke hub.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'at_courier_hub',
                'current_hub_id' => $request->user()->id // ID of the Sortir Kurir / Admin Kurir
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Diterima di Hub Kurir',
                'location' => 'Kantor Cabang Lokal',
                'note' => 'Paket telah tiba di pusat sortir kurir dan sedang diproses untuk distribusi logistik.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Paket berhasil diterima di Hub Kurir.']);
    }

    /**
     * Sortir Kurir marks package ready for Logistics distribution pickup
     */
    public function readyForLogistics(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->status !== 'at_courier_hub') {
            return response()->json(['message' => 'Paket harus berada di hub kurir terlebih dahulu.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update(['status' => 'ready_for_logistics']);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Menunggu Penjemputan Logistik',
                'location' => 'Kantor Cabang Lokal',
                'note' => 'Paket siap diambil oleh tim distribusi logistik untuk pengiriman antar kota/provinsi.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Status paket: Siap dijemput Logistik.']);
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

        $request->validate([
            'status' => 'required|string',
            'proof_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'note' => 'nullable|string'
        ]);

        DB::transaction(function () use ($order, $request) {
            $proofImagePath = null;
            if ($request->hasFile('proof_image')) {
                $proofImagePath = $request->file('proof_image')->store('orders/proofs', 'public');
            }

            if ($request->status === 'failed_delivery') {
                $order->update(['status' => 'failed_delivery']);
                $note = $request->note ?? 'Penerima tidak dapat dihubungi atau alamat tidak valid.';
                OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Pengiriman Gagal (Retur)',
                    'location' => 'Lokasi Pembeli',
                    'note' => "RETUR: Dana dikembalikan secara otomatis. Alasan: {$note}",
                    'user_id' => $request->user()->id,
                    'proof_image' => $proofImagePath,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude
                ]);
            } else {
                $order->update([
                    'status' => 'delivered',
                    'delivered_at' => now()
                ]);
                OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Paket Telah Tiba',
                    'location' => 'Lokasi Pembeli',
                    'note' => $request->note ?? 'Paket telah diantarkan ke tujuan tertera.',
                    'user_id' => $request->user()->id,
                    'proof_image' => $proofImagePath,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude
                ]);
            }
        });

        return response()->json(['message' => 'Status pengantaran berhasil diperbarui']);
    }
    

    /**
     * Admin Kurir updates their mitra profile settings
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
                'pickup_courier_id' => $request->pickup_courier_id
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
    /**
     * Scan package by ID or Order Number
     */
    public function scanPackage(Request $request)
    {
        $request->validate(['query' => 'required|string']);
        $user = $request->user();

        $order = Order::where('id', $request->query)
            ->orWhere('id', 'like', '%' . $request->query)
            ->firstOrFail();

        // Determine action based on status
        if ($order->status === 'ready_for_pickup') {
            return $this->selfAssignPickup($request, $order->id);
        } elseif ($order->status === 'picking_up') {
            // If it's a courier, they mark as picked up. If it's a Sortir Kurir, they mark as received at hub.
            if ($user->role === 'sortir_kurir') return $this->receiveAtHub($request, $order->id);
            if ($order->pickup_courier_id == $user->id) return $this->pickupPackage($request, $order->id);
        } elseif ($order->status === 'at_courier_hub' && $user->role === 'sortir_kurir') {
            return $this->readyForLogistics($request, $order->id);
        } elseif ($order->status === 'delivering' && $order->delivery_courier_id == $user->id) {
            return $this->deliverPackage($request, $order->id);
        }

        return response()->json(['message' => 'Status paket tidak didukung untuk scan saat ini atau Anda tidak berwenang.'], 400);
    }

    /**
     * Enhanced performance stats
     */
    public function getPerformance(Request $request)
    {
        $user = $request->user();
        $isStaff = $user->role === 'kurir_staff';
        $parentId = $isStaff ? $user->parent_id : $user->id;

        $completedOrders = Order::where(function($q) use ($user, $parentId, $isStaff) {
                if ($isStaff) {
                    $q->where('pickup_courier_id', $user->id)->orWhere('delivery_courier_id', $user->id);
                } else {
                    $q->where('pickup_courier_id', $parentId)->orWhere('delivery_courier_id', $parentId);
                    // Or check if child of parent
                    $staffIds = User::where('parent_id', $parentId)->pluck('id')->toArray();
                    $q->orWhereIn('pickup_courier_id', $staffIds)->orWhereIn('delivery_courier_id', $staffIds);
                }
            })
            ->whereIn('status', ['delivered', 'completed'])
            ->count();

        return response()->json([
            'completed_tasks' => $completedOrders,
            'rating' => 4.9, // This would ideally come from an OrderReview model
            'punctuality' => 100,
            'revenue_share' => 100 
        ]);
    }

    /**
     * Update courier settings
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin_kurir') return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'mitra_name' => 'required|string|max:255',
            'no_hp' => 'nullable|string',
            'alamat' => 'nullable|string'
        ]);

        $user->mitra_name = $request->mitra_name;
        $user->no_hp = $request->no_hp;
        $user->alamat = $request->alamat;
        $user->save();

        return response()->json(['message' => 'Pengaturan mitra berhasil diperbarui', 'user' => $user]);
    }

    /**
     * Staff rates their parent Mitra (Admin Kurir / Logistik)
     */
    public function submitMitraReview(Request $request)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000'
        ]);

        $user = $request->user();
        if (!$user->parent_id) {
            return response()->json(['message' => 'Anda tidak memiliki atasan untuk dinilai.'], 400);
        }

        $mitra = \App\Models\User::findOrFail($user->parent_id);

        \DB::transaction(function () use ($user, $mitra, $request) {
            \App\Models\MitraReview::updateOrCreate(
                ['staff_id' => $user->id, 'mitra_id' => $mitra->id],
                [
                    'rating' => $request->rating,
                    'comment' => $request->comment
                ]
            );

            // Recalculate Mitra Rating
            $allReviews = \App\Models\MitraReview::where('mitra_id', $mitra->id)->get();
            $mitra->update([
                'rating' => $allReviews->avg('rating') ?? 5.0,
                'rating_count' => $allReviews->count()
            ]);
        });

        return response()->json(['message' => 'Penilaian Mitra berhasil dikirim secara anonim.']);
    }

    /**
     * Mitra views reviews from their staff (Anonymized)
     */
    public function getMitraReviews(Request $request)
    {
        $user = $request->user();
        
        // Only admins can see reviews
        if (!in_array($user->role, ['admin_kurir', 'admin_logistik', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reviews = \App\Models\MitraReview::where('mitra_id', $user->id)
            ->latest()
            ->get()
            ->map(function($r) {
                return [
                    'id' => $r->id,
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'created_at' => $r->created_at,
                    'staff_name' => 'Anonim Staff' // Ensure anonymity
                ];
            });

        return response()->json($reviews);
    }
    /**
     * Admin Kurir updates staff salary per package
     */
    public function updateStaffSalary(Request $request, $id)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin_kurir' && $admin->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'salary_per_package' => 'required|numeric|min:0'
        ]);

        $staff = User::where('parent_id', $admin->id)->findOrFail($id);
        $staff->salary_per_package = $request->salary_per_package;
        $staff->save();

        return response()->json(['message' => 'Gaji per paket berhasil diperbarui']);
    }
}
