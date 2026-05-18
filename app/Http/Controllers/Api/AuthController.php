<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Notifications\SendOTPNotification;
use Carbon\Carbon;

class AuthController extends Controller
{
    private function generateOTP(User $user, $type = 'verification')
    {
        $otp = rand(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        $user->notify(new SendOTPNotification($otp, $type));
    }
    public function register(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'username' => 'required|string|unique:users',
            'nohp' => 'required|string',
            'country_code' => 'nullable|string',
            'alamat' => 'nullable|string',
            'password' => 'required|min:8|confirmed',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $user = User::create([
            'email' => $request->email,
            'username' => $request->username,
            'no_hp' => $request->country_code . $request->nohp,
            'alamat' => $request->alamat ?? '',
            'password' => Hash::make($request->password),
            'name' => $request->username,
            'role' => 'user',
            'status' => 'active',
            'avatar' => $request->hasFile('avatar') ? $request->file('avatar')->store('users/avatars', 'public') : null
        ]);

        $this->generateOTP($user, 'verification');
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Akun berhasil dibuat! Silakan cek email untuk kode verifikasi.',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    public function registerMitra(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'username' => 'required|string|unique:users',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:admin_kurir,admin_logistik,shop_owner',
            'region_id' => 'required|exists:regions,id',
            'no_hp' => 'required|string',
            'coverage_province' => 'required_if:role,admin_logistik,admin_kurir',
            'coverage_regency' => 'required_if:role,admin_kurir',
            'coverage_district' => 'required_if:role,admin_kurir',
        ]);

        $status = ($request->role === 'shop_owner') ? 'active' : 'pending';

        $mitraType = 'none';
        if ($request->role === 'admin_kurir') $mitraType = 'kurir';
        if ($request->role === 'admin_logistik') $mitraType = 'logistik';

        $region = \App\Models\Region::find($request->region_id);
        $country = $region ? $region->country : 'Indonesia';

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'username' => $request->username,
            'no_hp' => $request->no_hp,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'region_id' => $request->region_id,
            'country' => $country,
            'mitra_type' => $mitraType,
            'mitra_name' => $request->mitra_name ?? $request->name,
            'status' => $status,
            'coverage_province' => $request->coverage_province,
            'coverage_regency' => $request->coverage_regency,
            'coverage_district' => $request->coverage_district,
        ]);

        return response()->json([
            'message' => 'Pendaftaran Mitra berhasil! Akun Anda sedang ditinjau oleh tim Radencak Shop.',
            'user' => $user
        ], 201);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate(['otp' => 'required|string|size:6']);
        $user = $request->user();

        if ($user->otp_code === $request->otp && $user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $user->email_verified_at = Carbon::now();
            $user->otp_code = null;
            $user->otp_expires_at = null;
            $user->save();

            return response()->json(['message' => 'Email berhasil diverifikasi!']);
        }

        return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 422);
    }

    public function resendOTP(Request $request)
    {
        $user = $request->user();
        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email sudah diverifikasi.'], 422);
        }

        $this->generateOTP($user, 'verification');
        return response()->json(['message' => 'Kode OTP baru telah dikirim.']);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $request->email)
                    ->where('username', $request->username)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email, Username, atau Password salah!'], 401);
        }

        if ($user->two_factor_enabled) {
            $this->generateOTP($user, '2fa');
            return response()->json([
                'requires_2fa' => true,
                'message' => 'Kode 2FA telah dikirim ke email Anda.'
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil!',
            'token' => $token,
            'user' => $user->load('shop')
        ], 200);
    }

    public function verify2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'username' => 'required|string',
            'otp' => 'required|string|size:6'
        ]);

        $user = User::where('email', $request->email)
                    ->where('username', $request->username)
                    ->first();

        if ($user && $user->otp_code === $request->otp && $user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $user->otp_code = null;
            $user->otp_expires_at = null;
            $user->save();

            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'message' => 'Login berhasil!',
                'token' => $token,
                'user' => $user->load('shop')
            ]);
        }

        return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 422);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'username' => 'required|string'
        ]);
        
        $user = User::where('email', $request->email)
                    ->where('username', $request->username)
                    ->first();

        if ($user) {
            $this->generateOTP($user, 'reset_password');
        }

        return response()->json(['message' => 'Jika data cocok, kode reset telah dikirim ke email Anda.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'username' => 'required|string',
            'otp' => 'required|string|size:6',
            'password' => 'required|min:8|confirmed'
        ]);

        $user = User::where('email', $request->email)
                    ->where('username', $request->username)
                    ->first();

        if ($user && $user->otp_code === $request->otp && $user->otp_expires_at && $user->otp_expires_at->isFuture()) {
            $user->password = Hash::make($request->password);
            $user->otp_code = null;
            $user->otp_expires_at = null;
            $user->save();

            return response()->json(['message' => 'Kata sandi berhasil diatur ulang.']);
        }

        return response()->json(['message' => 'Data tidak cocok, atau kode OTP salah/kadaluarsa.'], 422);
    }

    public function toggle2FA(Request $request)
    {
        $user = $request->user();
        $user->two_factor_enabled = !$user->two_factor_enabled;
        $user->save();

        return response()->json([
            'message' => $user->two_factor_enabled ? '2FA diaktifkan.' : '2FA dinonaktifkan.',
            'enabled' => $user->two_factor_enabled
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Berhasil logout']);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'no_hp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'password' => 'nullable|min:8|confirmed'
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->no_hp = $request->no_hp;
        $user->alamat = $request->alamat;

        if ($request->hasFile('avatar')) {
            $user->avatar = $request->file('avatar')->store('users/avatars', 'public');
        }

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user
        ]);
    }
    public function registerStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
            'role' => 'required|in:kurir_staff,sortir_kurir,kurir,logistik_staff,sortir_logistik,logistik_internal,logistik_external,shop_staff',
            'no_hp' => 'required|string',
            'parent_id' => 'required|exists:users,id', // ID Pemilik Toko/Mitra
        ]);

        $parent = User::findOrFail($request->parent_id);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username ?? (strtolower(str_replace(' ', '_', $request->name)) . rand(100, 999)),
            'email' => $request->email,
            'no_hp' => $request->no_hp,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'mitra_type' => in_array($request->role, ['kurir_staff', 'sortir_kurir', 'kurir']) ? 'kurir' : (in_array($request->role, ['logistik_staff', 'sortir_logistik', 'logistik_internal', 'logistik_external']) ? 'logistik' : 'none'),
            'parent_id' => $request->parent_id,
            'region_id' => $parent->region_id,
            'country' => $parent->country ?? 'Indonesia',
            'coverage_province' => $parent->coverage_province,
            'coverage_regency' => $parent->coverage_regency,
            'coverage_district' => $parent->coverage_district,
            'status' => 'pending' // Menunggu persetujuan pemilik
        ]);

        return response()->json([
            'message' => 'Pendaftaran staff berhasil! Silakan hubungi admin mitra/toko Anda untuk verifikasi.',
            'user' => $user
        ], 201);
    }
    public function applyMitra(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'role' => 'required|in:admin_kurir,admin_logistik,shop_owner',
            'region_id' => 'required|exists:regions,id',
            'no_hp' => 'required|string',
            'name' => 'required|string|max:255', // Nama Mitra/Perusahaan
            'coverage_province' => 'required_if:role,admin_logistik,admin_kurir',
            'coverage_regency' => 'required_if:role,admin_kurir',
            'coverage_district' => 'required_if:role,admin_kurir',
        ]);

        $status = ($request->role === 'shop_owner') ? 'active' : 'pending';

        $mitraType = 'none';
        if ($request->role === 'admin_kurir') $mitraType = 'kurir';
        if ($request->role === 'admin_logistik') $mitraType = 'logistik';

        if ($status === 'active') {
            $user->role = $request->role;
        } else {
            $user->pending_role = $request->role;
        }
        $user->region_id = $request->region_id;
        $user->country = \App\Models\Region::find($request->region_id)->country ?? 'Indonesia';
        $user->no_hp = $request->no_hp;
        $user->mitra_type = $mitraType;
        $user->mitra_name = $request->mitra_name ?? $request->name;
        $user->status = $status;
        $user->coverage_province = $request->coverage_province;
        $user->coverage_regency = $request->coverage_regency;
        $user->coverage_district = $request->coverage_district;
        $user->save();

        // Notifikasi untuk Super Admin
        if ($status === 'pending') {
            $superAdmins = \App\Models\User::where('role', 'super_admin')->get();
            foreach ($superAdmins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'system',
                    'message' => "Ada pengajuan mitra baru dari {$user->name} sebagai " . str_replace('_', ' ', $request->role),
                    'reference_id' => 'mitra_request'
                ]);
            }
        }

        $msg = ($status === 'active') ? 'Pendaftaran berhasil! Role Anda kini telah diperbarui.' : 'Pendaftaran Mitra berhasil! Tunggu verifikasi dari Super Admin.';

        return response()->json([
            'message' => $msg,
            'user' => $user
        ]);
    }

    public function applyStaff(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'role' => 'required|in:kurir_staff,sortir_kurir,kurir,logistik_staff,sortir_logistik,logistik_internal,logistik_external,shop_staff',
            'parent_id' => 'required|exists:users,id',
        ]);

        $parent = User::findOrFail($request->parent_id);

        $user->pending_role = $request->role;
        $user->parent_id = $request->parent_id;
        $user->region_id = $parent->region_id;
        $user->country = $parent->country ?? 'Indonesia';
        $user->coverage_province = $parent->coverage_province;
        $user->coverage_regency = $parent->coverage_regency;
        $user->coverage_district = $parent->coverage_district;
        $user->status = 'pending';

        if (in_array($request->role, ['kurir_staff', 'sortir_kurir', 'kurir'])) $user->mitra_type = 'kurir';
        if (in_array($request->role, ['logistik_staff', 'sortir_logistik', 'logistik_internal', 'logistik_external'])) $user->mitra_type = 'logistik';
        
        $user->save();

        return response()->json([
            'message' => 'Lamaran staff berhasil dikirim! Silakan hubungi atasan Anda untuk verifikasi.',
            'user' => $user
        ]);
    }
}
