<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\User;

class UserController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'region_id' => 'nullable|exists:regions,id',
            'avatar' => 'nullable|image|max:2048'
        ]);

        $user->name = $request->name;
        if ($request->has('no_hp')) $user->no_hp = $request->no_hp;
        if ($request->has('alamat')) $user->alamat = $request->alamat;
        if ($request->has('region_id')) $user->region_id = $request->region_id;

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('users/avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user
        ]);
    }

    public function getMyStaff(Request $request)
    {
        $user = $request->user();
        // Hanya pemilik (admin_kurir, admin_logistik, shop_owner) yang bisa lihat staffnya
        if (!in_array($user->role, ['admin_kurir', 'admin_logistik', 'shop_owner', 'super_admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff = User::where('parent_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($staff);
    }

    public function updateStaffStatus(Request $request, $id)
    {
        $user = $request->user();
        $target = User::findOrFail($id);

        // Pastikan yang mengupdate adalah parentnya atau super admin
        if ($target->parent_id !== $user->id && $user->role !== 'super_admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['status' => 'required|in:active,rejected']);
        
        if ($request->status === 'active') {
            if ($target->pending_role) {
                $target->role = $target->pending_role;
            }
            $target->status = 'active';
        } else {
            // Rejected
            $target->status = 'active'; // keep main account active
            $target->parent_id = null;
            $target->mitra_type = 'none';
        }
        $target->pending_role = null;
        $target->save();

        return response()->json(['message' => "Status staff diperbarui menjadi {$request->status}"]);
    }

    public function getMitraList()
    {
        // Daftar semua pemilik mitra (toko, kurir, logistik) yang aktif
        $owners = User::whereIn('role', ['admin_kurir', 'admin_logistik', 'shop_owner'])
            ->where('status', 'active')
            ->select('id', 'name', 'mitra_name', 'role', 'region_id', 'coverage_province', 'coverage_regency', 'coverage_district')
            ->with('region:id,name,country')
            ->get();
            
        return response()->json($owners);
    }
    public function acceptInvite(Request $request, $id)
    {
        $notification = \App\Models\Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($notification->type !== 'staff_invite') {
            return response()->json(['message' => 'Notifikasi ini bukan undangan staff'], 400);
        }

        $data = json_decode($notification->data, true);
        $user = $request->user();

        $inviter = User::find($data['inviter_id']);
        if (!$inviter) return response()->json(['message' => 'Pengundang tidak ditemukan'], 404);

        $user->parent_id = $data['inviter_id'];
        $user->role = $data['role'];
        $user->region_id = $inviter->region_id; // Samakan wilayah dengan atasan
        $user->status = 'active';
        $user->save();

        $notification->delete();

        return response()->json([
            'message' => 'Selamat! Anda sekarang resmi bergabung sebagai staff.',
            'user' => $user
        ]);
    }

    public function fireStaff(Request $request, $id)
    {
        $user = $request->user();
        $target = User::where('id', $id)->where('parent_id', $user->id)->firstOrFail();

        $target->parent_id = null;
        $target->role = 'user'; // Kembali jadi user biasa
        $target->status = 'active';
        $target->save();

        return response()->json(['message' => "Staff {$target->name} telah diberhentikan."]);
    }

    public function updateUserStatus(Request $request, $id)
    {
        if (!in_array($request->user()->role, ['super_admin', 'admin_staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['status' => 'required|in:active,pending,suspended,rejected']);
        $target = User::findOrFail($id);
        
        if ($target->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin tidak bisa diblokir atau diubah statusnya!'], 403);
        }
        $target->status = $request->status;
        $target->save();

        return response()->json(['message' => "Status {$target->name} berhasil diubah menjadi {$request->status}"]);
    }
}
