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
            'avatar' => 'nullable|image|max:2048'
        ]);

        $user->name = $request->name;
        if ($request->has('no_hp')) $user->no_hp = $request->no_hp;
        if ($request->has('alamat')) $user->alamat = $request->alamat;

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
}
