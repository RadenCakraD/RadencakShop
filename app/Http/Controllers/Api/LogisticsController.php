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
     * Get tasks for logistics distribution staff (Internal / External)
     */
    public function getMyTasks(Request $request)
    {
        $user = $request->user();
        $isInternal = $user->role === 'logistik_internal';
        $isExternal = $user->role === 'logistik_external';
        $isSortir = $user->role === 'sortir_logistik';

        $province = $user->coverage_province ?? ($user->parent ? $user->parent->coverage_province : null);
        $regency = $user->coverage_regency ?? ($user->parent ? $user->parent->coverage_regency : null);

        $queryFn = function($q) use ($province, $regency) {
            if ($province && $regency) {
                $q->where('origin_province', $province)->where('origin_regency', $regency);
            } else if ($province) {
                $q->where('origin_province', $province);
            }
        };

        $tasks = [];
        $available = [];

        if ($isInternal) {
            // Internal drivers: Courier Hub <-> Logistics Hub (Mitra)
            $available = Order::where(function($q) {
                // Outgoing from local area: Ready at Courier Hub -> Warehouse
                $q->where('status', 'ready_for_logistics')
                // Incoming to local area: Ready at Warehouse -> Destination Courier Hub
                  ->orWhere(function($sub) {
                      $sub->where('status', 'at_logistics_hub')
                          ->whereColumn('origin_province', 'destination_province')
                          ->whereColumn('origin_regency', 'destination_regency');
                  });
            })->where($queryFn)->get();

            $tasks = Order::where('logistics_id', $user->id)
                ->whereIn('status', ['logistics_picking_up', 'transferring'])
                ->get();
        }

        if ($isExternal) {
            // External drivers: Logistics Hub <-> Logistics Hub (Cross-Region)
            $available = Order::where('status', 'at_logistics_hub')
                ->where(function($q) {
                    $q->whereColumn('origin_province', '!=', 'destination_province')
                      ->orWhereColumn('origin_regency', '!=', 'destination_regency');
                })
                ->where($queryFn)
                ->get();

            $tasks = Order::where('logistics_id', $user->id)
                ->where('status', 'transferring')
                ->get();
        }

        return response()->json([
            'tasks' => $tasks,
            'available' => $available,
            'stats' => [
                'completed' => Order::where('logistics_id', $user->id)->whereIn('status', ['delivered', 'completed', 'at_destination_hub'])->count(),
                'rating' => 5.0
            ]
        ]);
    }

    /**
     * Get logistics stats and recent tracks
     */
    public function stats(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin_logistik' && $user->role !== 'logistik_staff' && $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $regionId = $user->region_id;
        $coverageProvince = $user->coverage_province ?? ($user->parent ? $user->parent->coverage_province : null);
        $coverageRegency = $user->coverage_regency ?? ($user->parent ? $user->parent->coverage_regency : null);
        $isAdmin = $user->role === 'super_admin';

        $queryFn = function($q) use ($coverageProvince, $coverageRegency, $isAdmin) {
            if (!$isAdmin) {
                if ($coverageProvince && $coverageRegency) {
                    $q->where(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('origin_province', $coverageProvince)->where('origin_regency', $coverageRegency);
                    })->orWhere(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('destination_province', $coverageProvince)->where('destination_regency', $coverageRegency);
                    });
                } else if ($coverageProvince) {
                    $q->where('origin_province', $coverageProvince)->orWhere('destination_province', $coverageProvince);
                }
            }
        };

        $totalInDelivery = Order::where('status', 'delivering')->where($queryFn)->count();
        $totalProcessing = Order::whereIn('status', ['picking_up', 'at_logistics', 'ready_for_pickup'])->where($queryFn)->count();
        $totalDelivered = Order::whereIn('status', ['delivered', 'completed'])->where($queryFn)->count();
        $totalFailed = Order::where('status', 'failed_delivery')->where($queryFn)->count();

        $recentTracks = OrderTracking::whereHas('order', $queryFn)->with('order')->latest()->take(10)->get();

        $totalPackages = $totalInDelivery + $totalProcessing + $totalDelivered + $totalFailed;
        $efficiency = $totalPackages > 0 ? min(98, round(($totalDelivered / $totalPackages) * 100)) : 85;
        $security = $totalPackages > 0 ? min(99, round((($totalPackages - $totalFailed) / $totalPackages) * 100)) : 99;

        return response()->json([
            'total_in_delivery' => $totalInDelivery,
            'total_processing' => $totalProcessing,
            'total_delivered' => $totalDelivered,
            'recent_tracks' => $recentTracks,
            'performance' => [
                'efficiency' => $efficiency,
                'security' => $security
            ]
        ]);
    }

    /**
     * Get pending packages mapping
     */
    public function getPackages(Request $request)
    {
        $user = $request->user();
        $coverageProvince = $user->coverage_province ?? ($user->parent ? $user->parent->coverage_province : null);
        $coverageRegency = $user->coverage_regency ?? ($user->parent ? $user->parent->coverage_regency : null);
        $isAdmin = $user->role === 'super_admin';

        $queryFn = function($q) use ($coverageProvince, $coverageRegency, $isAdmin) {
            if (!$isAdmin) {
                if ($coverageProvince && $coverageRegency) {
                    $q->where(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('origin_province', $coverageProvince)->where('origin_regency', $coverageRegency);
                    })->orWhere(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('destination_province', $coverageProvince)->where('destination_regency', $coverageRegency);
                    });
                } else if ($coverageProvince) {
                    $q->where('origin_province', $coverageProvince)->orWhere('destination_province', $coverageProvince);
                }
            }
        };

        // Packages ready to be picked up from Courier Hubs by Logistics
        $readyForLogistics = Order::with(['shop', 'pickupCourier'])->where('status', 'ready_for_logistics')->where($queryFn)->get();
        // Packages currently being picked up by Logistics staff
        $pickingUp = Order::with(['shop', 'pickupCourier'])->where('status', 'logistics_picking_up')->where($queryFn)->get();
        // Packages at Warehouse waiting to be assigned for next leg or final delivery
        $atWarehouse = Order::with(['shop', 'pickupCourier'])->where('status', 'at_logistics_hub')->where($queryFn)->get();
        // Packages assigned for final last-mile delivery to Courier Hubs
        $delivering = Order::with('deliveryCourier')->where('status', 'delivering')->where($queryFn)->get();

        return response()->json([
            'ready_for_logistics' => $readyForLogistics,
            'picking_up' => $pickingUp,
            'at_warehouse' => $atWarehouse,
            'delivering' => $delivering
        ]);
    }

    /**
     * Logistics staff self-assigns to pickup from Courier Hub
     */
    public function pickupFromCourierHub(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->status !== 'ready_for_logistics') {
            return response()->json(['message' => 'Paket belum siap diambil dari hub kurir.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'logistics_picking_up',
                'logistics_id' => $request->user()->id // Driver ID
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Dijemput Distribusi Logistik',
                'location' => 'Kantor Cabang Kurir',
                'note' => 'Tim distribusi logistik sedang dalam perjalanan menjemput paket di kantor cabang.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Tugas penjemputan logistik diterima.']);
    }

    /**
     * Logistics staff receives package at Logistics Hub
     */
    public function receiveAtLogisticsHub(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        if ($order->status !== 'logistics_picking_up') {
            return response()->json(['message' => 'Paket tidak sedang dalam penjemputan logistik.'], 400);
        }

        DB::transaction(function () use ($order, $request) {
            $order->update([
                'status' => 'at_logistics_hub'
            ]);

            OrderTracking::create([
                'order_id' => $order->id,
                'status' => 'Diterima di Gudang Sentral',
                'location' => 'Logistik Hub Utama',
                'note' => 'Paket telah tiba di gudang utama logistik dan sedang disortir untuk pengiriman antar wilayah.',
                'user_id' => $request->user()->id
            ]);
        });

        return response()->json(['message' => 'Paket diterima di Hub Logistik.']);
    }

    /**
     * Scan / Receive package into logistics warehouse (Legacy / Alternative)
     */
    public function receivePackage(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);
        
        if ($order->status !== 'picking_up') {
            return response()->json(['message' => 'Paket belum di-pickup oleh kurir atau status tidak valid.'], 400);
        }

        $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

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
                'user_id' => $request->user()->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude
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
            'delivery_courier_id' => 'required|exists:users,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        try {
            DB::transaction(function () use ($orderId, $request) {
                $order = Order::where('id', $orderId)->lockForUpdate()->firstOrFail();
                
                if ($order->status !== 'at_logistics_hub' && $order->status !== 'at_logistics') {
                    throw new \Exception('Hanya paket yang berada di gudang yang bisa di-assign.');
                }

                $order->update([
                    'status' => 'delivering',
                    'delivery_courier_id' => $request->delivery_courier_id
                ]);

                OrderTracking::create([
                    'order_id' => $order->id,
                    'status' => 'Kurir Menuju Lokasi Anda',
                    'location' => 'Keluar dari Gudang',
                    'note' => 'Paket telah diserahkan kepada kurir pengantar.',
                    'user_id' => $request->user()->id,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude
                ]);
            });
            
            return response()->json(['message' => 'Penugasan pengantaran berhasil.']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function getStaffs(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin_logistik', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $query = \App\Models\User::whereIn('role', ['logistik_staff', 'sortir_logistik', 'logistik_internal', 'logistik_external']);
        if ($user->role !== 'super_admin') {
            $query->where('parent_id', $user->id);
        }
        $staffs = $query->get();
        return response()->json($staffs);
    }
    /**
     * Get Radar Log - Packages in current region
     */
    public function getRadarLog(Request $request)
    {
        $user = $request->user();
        $coverageProvince = $user->coverage_province ?? ($user->parent ? $user->parent->coverage_province : null);
        $coverageRegency = $user->coverage_regency ?? ($user->parent ? $user->parent->coverage_regency : null);
        $isAdmin = $user->role === 'super_admin';

        $packages = Order::with(['user', 'shop', 'pickupCourier', 'deliveryCourier'])
            ->when(!$isAdmin, function($q) use ($coverageProvince, $coverageRegency) {
                if ($coverageProvince && $coverageRegency) {
                    $q->where(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('origin_province', $coverageProvince)->where('origin_regency', $coverageRegency);
                    })->orWhere(function($sub) use ($coverageProvince, $coverageRegency) {
                        $sub->where('destination_province', $coverageProvince)->where('destination_regency', $coverageRegency);
                    });
                } else if ($coverageProvince) {
                    $q->where('origin_province', $coverageProvince)
                      ->orWhere('destination_province', $coverageProvince);
                }
            })
            ->whereNotIn('status', ['delivered', 'completed', 'cancelled'])
            ->get();

        return response()->json($packages);
    }

    /**
     * Update logistics settings
     */
    public function updateSettings(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin_logistik') return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'mitra_name' => 'required|string|max:255',
            'no_hp' => 'nullable|string',
            'alamat' => 'nullable|string'
        ]);

        $user->mitra_name = $request->mitra_name;
        $user->no_hp = $request->no_hp;
        $user->alamat = $request->alamat;
        $user->save();

        return response()->json(['message' => 'Pengaturan logistik berhasil diperbarui', 'user' => $user]);
    }
    /**
     * Admin Logistik updates staff salary per package
     */
    public function updateStaffSalary(Request $request, $id)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin_logistik' && $admin->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'salary_per_package' => 'required|numeric|min:0'
        ]);

        $staff = \App\Models\User::where('parent_id', $admin->id)->findOrFail($id);
        $staff->salary_per_package = $request->salary_per_package;
        $staff->save();

        return response()->json(['message' => 'Gaji per paket berhasil diperbarui']);
    }
}
