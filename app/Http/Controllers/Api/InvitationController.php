<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    public function index(Request $request)
    {
        $invites = Invitation::where('sender_id', $request->user()->id)
            ->with('shop')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($invites);
    }

    public function receivedInvitations(Request $request)
    {
        $invites = Invitation::where('email', $request->user()->email)
            ->where('status', 'pending')
            ->with(['inviter', 'shop'])
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($invites);
    }

    public function sendInvite(Request $request)
    {
        $user = $request->user();
        $request->validate(['email' => 'required|email']);

        $targetUser = User::where('email', $request->email)->first();
        if (!$targetUser) return response()->json(['message' => 'Pengguna dengan email tersebut tidak ditemukan'], 404);
        if ($targetUser->parent_id) return response()->json(['message' => 'Pengguna ini sudah menjadi staff di tempat lain'], 400);

        // Deterministik Role
        $role = null;
        if ($user->role === 'shop_owner') $role = 'shop_staff';
        elseif ($user->role === 'admin_kurir') $role = 'kurir_staff';
        elseif ($user->role === 'admin_logistik') $role = 'logistik_staff';
        elseif (in_array($user->role, ['admin_staff', 'super_admin'])) $role = 'admin_staff';
        
        if (!$role) return response()->json(['message' => 'Anda tidak memiliki otoritas untuk merekrut staff'], 403);

        $invitation = Invitation::create([
            'sender_id' => $user->id,
            'email' => $request->email,
            'role' => $role,
            'shop_id' => $user->shop ? $user->shop->id : null,
            'token' => Str::random(40),
            'status' => 'pending'
        ]);

        \App\Models\Notification::create([
            'user_id' => $targetUser->id,
            'type' => 'staff_invite',
            'message' => "Anda diundang bergabung sebagai staff oleh {$user->name}.",
            'data' => json_encode([
                'invitation_id' => $invitation->id,
                'inviter_id' => $user->id,
                'role' => $role,
                'inviter_name' => $user->name
            ])
        ]);

        return response()->json(['message' => 'Undangan berhasil dikirim ke ' . $request->email, 'invitation' => $invitation]);
    }

    public function acceptInvite(Request $request, $token)
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();
        $user = $request->user();

        if ($invitation->email !== $user->email) {
            return response()->json(['message' => 'Undangan ini bukan untuk Anda'], 403);
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => 'Undangan sudah tidak berlaku'], 400);
        }

        DB::transaction(function() use ($invitation, $user) {
            $user->parent_id = $invitation->sender_id;
            $user->role = $invitation->role;
            $user->region_id = $invitation->inviter->region_id; // Samakan wilayah
            $user->status = 'active';
            $user->save();

            $invitation->status = 'accepted';
            $invitation->save();
        });

        return response()->json(['message' => 'Berhasil bergabung!', 'user' => $user]);
    }

    public function cancelInvite($token)
    {
        $invitation = Invitation::where('token', $token)->firstOrFail();
        if ($invitation->status !== 'pending') return response()->json(['message' => 'Tidak bisa membatalkan undangan'], 400);
        
        $invitation->status = 'canceled';
        $invitation->save();
        return response()->json(['message' => 'Undangan dibatalkan']);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
