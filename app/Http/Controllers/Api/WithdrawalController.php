<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Withdrawal;
use App\Models\Order;

class WithdrawalController extends Controller
{
    public function index(Request $request) 
    {
        $user = $request->user();
        $withdrawals = Withdrawal::where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json($withdrawals);
    }

    public function requestWithdrawal(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000',
            'type' => 'required|in:courier,shop',
            'bank_info' => 'required|string'
        ]);

        $user = $request->user();
        $type = $request->type;
        $amount = $request->amount;

        // Check Balance
        $availableBalance = 0;
        
        if ($type === 'courier') {
            $completedPickups = Order::where('pickup_courier_id', $user->id)
                ->whereIn('status', ['at_logistics', 'delivering', 'delivered', 'completed'])->sum('pickup_fee_earned');
            $completedDeliveries = Order::where('delivery_courier_id', $user->id)
                ->whereIn('status', ['delivered', 'completed'])->sum('delivery_fee_earned');
                
            $totalEarned = $completedPickups + $completedDeliveries;
            $totalWithdrawn = Withdrawal::where('user_id', $user->id)->where('type', 'courier')->where('status', '!=', 'rejected')->sum('amount');
            $availableBalance = $totalEarned - $totalWithdrawn;
        } 
        else if ($type === 'shop') {
            if (!$user->shop) return response()->json(['message' => 'Anda tidak memiliki toko'], 400);
            
            $completedOrdersQuery = Order::where('shop_id', $user->shop->id)
                ->where('status', 'completed');
                
            $completedOrdersSum = $completedOrdersQuery->sum('total_amount'); 
            $completedOrdersCount = (clone $completedOrdersQuery)->count();
            
            // Per order deduction: 10,000 (shipping) + 500 (service fee)
            $actualShopEarnings = $completedOrdersSum - ($completedOrdersCount * 10500);
                
            $totalWithdrawn = Withdrawal::where('user_id', $user->id)->where('type', 'shop')->where('status', '!=', 'rejected')->sum('amount');
            $availableBalance = $actualShopEarnings - $totalWithdrawn;
        }

        if ($amount > $availableBalance) {
            return response()->json(['message' => 'Saldo tidak mencukupi. Saldo penarikan tersedia: Rp ' . number_format($availableBalance, 0, ',', '.')], 400);
        }

        $w = Withdrawal::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'status' => 'pending',
            'type' => $type,
            'notes' => 'Permintaan penarikan ke ' . $request->bank_info,
        ]);

        return response()->json(['message' => 'Penarikan berhasil diajukan', 'withdrawal' => $w], 201);
    }
}
