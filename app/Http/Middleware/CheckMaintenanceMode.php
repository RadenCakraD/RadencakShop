<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/global-settings') || $request->is('api/login') || $request->is('api/user')) {
            return $next($request);
        }

        $maintenanceMode = \DB::table('site_configs')->where('key', 'maintenance_mode')->value('value');
        if ($maintenanceMode === '1') {
            if (auth('sanctum')->check()) {
                $user = auth('sanctum')->user();
                if (in_array($user->role, ['super_admin', 'admin_staff'])) {
                    return $next($request);
                }
            }
            
            return response()->json([
                'message' => 'Sistem sedang dalam perbaikan berkala. Mohon kembali beberapa saat lagi.',
                'maintenance' => true
            ], 503);
        }

        return $next($request);
    }
}
