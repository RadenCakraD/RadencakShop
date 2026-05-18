<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->status !== 'active') {
            if (in_array($request->user()->status, ['rejected', 'suspended'])) {
                return response()->json([
                    'message' => 'Akun Anda telah dinonaktifkan atau ditangguhkan oleh Admin Radencak Shop.',
                    'status' => 'suspended'
                ], 403);
            }

            if ($request->user()->status === 'pending') {
                // Biarkan dia akses profile/user info, tapi blokir dashboard mitra
                if ($request->is('api/courier/*') || $request->is('api/logistics/*') || $request->is('api/shop/*')) {
                    return response()->json([
                        'message' => 'Akun Anda masih dalam tahap verifikasi oleh Admin.',
                        'status' => 'pending'
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
