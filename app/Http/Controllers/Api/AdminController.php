<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Banner;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class AdminController extends Controller
{
    private function isAdmin($user) {
        return $user && in_array($user->role, ['super_admin', 'admin_staff']);
    }

    public function getBanners()
    {
        return response()->json(Banner::orderBy('position', 'asc')->orderBy('created_at', 'desc')->get());
    }

    public function getActiveBanners()
    {
        $banners = \Illuminate\Support\Facades\Cache::remember('banners.active', 60*24, function() {
            return Banner::where('is_active', true)->orderBy('position', 'asc')->orderBy('created_at', 'desc')->get();
        });
        return response()->json($banners);
    }

    public function storeBanner(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate([
            'image' => 'required|image|max:5120', // 5MB
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'link_url' => 'nullable|string',
        ]);

        $path = $request->file('image')->store('banners', 'public');
        
        $maxPosition = Banner::max('position');

        $banner = Banner::create([
            'image_url' => $path,
            'title' => $request->title,
            'description' => $request->description,
            'link_url' => $request->link_url,
            'position' => $maxPosition !== null ? $maxPosition + 1 : 0,
            'is_active' => true,
        ]);

        \App\Jobs\ProcessBannerImage::dispatch($banner->id, $path);

        return response()->json(['message' => 'Banner sedang diproses...', 'banner' => $banner], 201);
    }

    public function updateBanner(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $banner = Banner::findOrFail($id);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $banner->image_url = $path;
            $banner->save();
            \App\Jobs\ProcessBannerImage::dispatch($banner->id, $path);
        }

        $banner->title = $request->title;
        $banner->description = $request->description;
        $banner->link_url = $request->link_url;
        $banner->save();

        \Illuminate\Support\Facades\Cache::forget('banners.active');

        return response()->json(['message' => 'Banner diperbarui', 'banner' => $banner]);
    }

    public function reorderBanners(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        foreach ($request->ordered_ids as $index => $id) {
            Banner::where('id', $id)->update(['position' => $index]);
        }
        \Illuminate\Support\Facades\Cache::forget('banners.active');
        return response()->json(['message' => 'Urutan banner berhasil disimpan']);
    }

    public function destroyBanner(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $banner = Banner::findOrFail($id);
        if ($banner->image_url) Storage::disk('public')->delete($banner->image_url);
        $banner->delete();

        \Illuminate\Support\Facades\Cache::forget('banners.active');

        return response()->json(['message' => 'Banner dihapus']);
    }

    // Products (Flash Sale)
    public function fetchAllProducts(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $query = Product::with(['shop', 'images']);
        if ($request->q) {
            $query->where('nama_produk', 'like', '%' . $request->q . '%');
        }
        $products = $query->orderBy('created_at', 'desc')->paginate(50);
        return response()->json($products);
    }

    public function toggleFlashSale(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $product = Product::findOrFail($id);
        $product->is_flash_sale = $request->input('is_flash_sale', !$product->is_flash_sale);
        
        if ($product->is_flash_sale) {
            $product->flash_sale_start = $request->input('flash_sale_start', now());
            $product->flash_sale_end = $request->input('flash_sale_end', now()->addDay()->endOfDay());
        } else {
            $product->flash_sale_start = null;
            $product->flash_sale_end = null;
        }
        
        $product->save();

        return response()->json(['message' => 'Status flash sale diubah', 'product' => $product]);
    }

    public function bulkFlashSale(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $updates = $request->updates; // format: { id: boolean }
        $start = $request->flash_sale_start;
        $end = $request->flash_sale_end;

        foreach ($updates as $id => $isFlashSale) {
            $updateData = ['is_flash_sale' => $isFlashSale];
            if ($isFlashSale) {
                if ($start) $updateData['flash_sale_start'] = $start;
                if ($end) $updateData['flash_sale_end'] = $end;
            } else {
                $updateData['flash_sale_start'] = null;
                $updateData['flash_sale_end'] = null;
            }
            Product::where('id', $id)->update($updateData);
        }

        return response()->json(['message' => 'Status flash sale masal berhasil diperbarui']);
    }

    // Users
    public function getAllUsers(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        
        $query = User::query();
        
        if ($request->role) {
            if ($request->role === 'courier') {
                $query->where('role', 'admin_kurir');
                if (!$request->status) {
                    $query->where('status', '!=', 'pending');
                }
            } elseif ($request->role === 'logistics') {
                $query->where('role', 'admin_logistik');
                if (!$request->status) {
                    $query->where('status', '!=', 'pending');
                }
            } else {
                $query->where('role', $request->role);
            }
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->q) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('username', 'like', '%' . $request->q . '%')
                  ->orWhere('email', 'like', '%' . $request->q . '%');
            });
        }
        
        $users = $query->orderBy('created_at', 'desc')->paginate(50);
        return response()->json($users);
    }

    public function updateUserRole(Request $request, $id)
    {
        if (!$request->user() || $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Hanya Super Admin yang bisa ubah role!'], 403);
        }

        $request->validate(['role' => 'required|in:super_admin,admin_staff,admin_logistik,logistik_staff,admin_kurir,kurir_staff,user,user_premium,shop_owner,shop_staff']);

        $targetUser = User::findOrFail($id);

        if ($targetUser->role === 'super_admin') {
            return response()->json(['message' => 'Role Super Admin tidak bisa diubah oleh siapapun!'], 403);
        }

        $targetUser->role = $request->role;
        $targetUser->save();

        return response()->json(['message' => "Role diperbarui menjadi {$request->role}"]);
    }

    public function getAllWithdrawals(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $withdrawals = \App\Models\Withdrawal::with(['user', 'shop'])->orderBy('created_at', 'desc')->paginate(50);
        return response()->json($withdrawals);
    }

    public function approveWithdrawal(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $w = \App\Models\Withdrawal::findOrFail($id);
        if ($w->status !== 'pending') return response()->json(['message' => 'Hanya status pending yang bisa disetujui'], 400);

        $w->status = 'completed';
        $w->save();
        return response()->json(['message' => 'Penarikan dana disetujui dan dilabeli Selesai.']);
    }

    public function rejectWithdrawal(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $w = \App\Models\Withdrawal::findOrFail($id);
        if ($w->status !== 'pending') return response()->json(['message' => 'Hanya status pending yang bisa ditolak'], 400);

        $w->status = 'rejected';
        $w->save();
        // Catatan: Karena saldo toko/kurir dihitung secara dinamis dari sum(amount) di mana status != 'rejected',
        // mengubah status menjadi 'rejected' akan otomatis membatalkan potongan saldo (saldo kembali secara virtual).
        return response()->json(['message' => 'Penarikan dana DITOLAK (saldo dikembalikan/gagal potong).']);
    }
    public function destroyUser(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        
        $user = User::with('shop')->findOrFail($id);
        
        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin tidak bisa dihapus!'], 403);
        }

        // Hapus Toko/Mitra secara fisik jika ada
        if ($user->shop) {
            $user->shop->delete();
        }

        // Reset Staff jika ada (karena bosnya dihapus)
        User::where('parent_id', $user->id)->update([
            'parent_id' => null,
            'role' => 'user',
            'mitra_type' => 'none'
        ]);

        $name = $user->name;
        $user->delete();

        return response()->json(['message' => "User {$name} dan seluruh data terkait (Toko/Mitra) telah dihapus permanen."]);
    }
    public function getDashboardStats(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $totalRevenue = \App\Models\Order::where('status', 'completed')->sum('total_amount');
        $activeUsers = User::count();
        $pendingWithdrawals = \App\Models\Withdrawal::where('status', 'pending')->count();
        $totalOrders = \App\Models\Order::count();
        $activeComplaints = \App\Models\Complaint::where('status', 'open')->count();

        // Weekly Revenue Chart Data
        $revenueData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $dailyTotal = \App\Models\Order::where('status', 'completed')
                ->whereDate('created_at', $date)
                ->sum('total_amount');
            $revenueData[] = [
                'name' => now()->subDays($i)->format('D'),
                'total' => (float) $dailyTotal
            ];
        }

        return response()->json([
            'metrics' => [
                'total_revenue' => $totalRevenue,
                'active_users' => $activeUsers,
                'pending_withdrawals' => $pendingWithdrawals,
                'total_orders' => $totalOrders,
                'active_complaints' => $activeComplaints,
            ],
            'revenue_chart' => $revenueData,
            'recent_activity' => \App\Models\Order::with(['user', 'shop'])->orderBy('created_at', 'desc')->take(5)->get()
        ]);
    }
    public function getPendingMitra(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $mitra = User::where(function($query) {
                $query->whereIn('pending_role', ['admin_kurir', 'admin_logistik', 'shop_owner'])
                      ->orWhere(function($q) {
                          $q->whereIn('role', ['admin_kurir', 'admin_logistik', 'shop_owner'])
                            ->whereNull('pending_role');
                      });
            })
            ->where('status', 'pending')
            ->with('region')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($mitra);
    }

    public function updateMitraStatus(Request $request, $id)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        $request->validate(['status' => 'required|in:active,rejected']);
        $mitra = User::findOrFail($id);
        
        $originalRole = $mitra->role;
        $appliedRole = $mitra->pending_role ?: $mitra->role;

        if ($request->status === 'active') {
            if ($mitra->pending_role) {
                $mitra->role = $mitra->pending_role;
            }
            $mitra->status = 'active';
        } else {
            // Rejected
            $mitra->status = 'active'; // keep main account active
            $mitra->mitra_type = 'none'; // reset mitra type
            if (!$mitra->pending_role) {
                $mitra->role = 'user'; // reset role for old style pending mitras
            }
        }
        $mitra->pending_role = null;
        $mitra->save();

        // Kirim Notifikasi ke User
        \App\Models\Notification::create([
            'user_id' => $mitra->id,
            'type' => 'system',
            'message' => $request->status === 'active' 
                ? "Selamat! Pendaftaran Anda sebagai mitra (" . str_replace('_', ' ', $appliedRole) . ") telah DISETUJUI. Sekarang Anda memiliki akses penuh."
                : "Maaf, pendaftaran Anda sebagai mitra (" . str_replace('_', ' ', $appliedRole) . ") DITOLAK. Silakan hubungi admin untuk informasi lebih lanjut.",
            'reference_id' => 'mitra_request'
        ]);

        return response()->json(['message' => "Status mitra diperbarui menjadi {$request->status}"]);
    }

    public function getAllShops(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        
        $query = \App\Models\Shop::with('user');
        if ($request->q) {
            $query->where('nama_toko', 'like', '%' . $request->q . '%');
        }
        
        $shops = $query->orderBy('created_at', 'desc')->paginate(50);
        return response()->json($shops);
    }

    public function createStaff(Request $request)
    {
        $recruiter = $request->user();
        $allowedRoles = ['super_admin', 'admin_staff', 'admin_logistik', 'admin_kurir', 'shop_owner'];
        
        if (!in_array($recruiter->role, $allowedRoles)) {
            return response()->json(['message' => 'Anda tidak memiliki otoritas untuk rekrut staff'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'no_hp' => 'required|string',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin_staff,logistik_staff,kurir_staff',
            'region_id' => 'required|exists:regions,id'
        ]);

        $user = \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
            'username' => strtolower(explode(' ', $request->name)[0]) . rand(100, 999),
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'status' => 'active',
            'region_id' => $request->region_id,
            'parent_id' => in_array($recruiter->role, ['super_admin', 'admin_staff']) ? null : $recruiter->id,
            'mitra_type' => $request->role === 'admin_staff' ? 'none' : ($request->role === 'logistik_staff' ? 'logistik' : 'kurir')
        ]);

        return response()->json(['message' => 'Staff berhasil direkrut!', 'user' => $user]);
    }
    public function getSettings(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);
        
        $configs = \DB::table('site_configs')->pluck('value', 'key');
        return response()->json($configs);
    }

    public function getGlobalSettings()
    {
        $configs = \DB::table('site_configs')->whereIn('key', ['site_name', 'maintenance_mode'])->pluck('value', 'key');
        return response()->json([
            'site_name' => $configs->get('site_name', 'Radencak Shop'),
            'maintenance_mode' => $configs->get('maintenance_mode', '0') === '1'
        ]);
    }

    public function updateSettings(Request $request)
    {
        if (!$this->isAdmin($request->user())) return response()->json(['message' => 'Unauthorized'], 403);

        foreach ($request->all() as $key => $value) {
            \DB::table('site_configs')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        return response()->json(['message' => 'Pengaturan diperbarui']);
    }
}
