<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\Shop;

class ChatController extends Controller
{
    // Mengambil daftar chat si pengguna (baik sebagai pembeli maupun penjual)
    public function index(Request $request)
    {
        $user = $request->user();
        $shopId = $user->shop ? $user->shop->id : null;

        $query = Chat::with(['user', 'shop', 'latestMessage'])
            ->withCount([
                'messages as unread_as_seller' => function ($query) {
                    $query->where('is_read', false)->where('sender_type', 'user');
                },
                'messages as unread_as_buyer' => function ($query) {
                    $query->where('is_read', false)->where('sender_type', 'shop');
                }
            ]);

        if ($shopId) {
            $query->where('user_id', $user->id)->orWhere('shop_id', $shopId);
        } else {
            $query->where('user_id', $user->id);
        }

        $chats = $query->get()->sortByDesc(function($chat) {
            return $chat->latestMessage ? $chat->latestMessage->created_at : $chat->created_at;
        })->values()->map(function ($chat) use ($user, $shopId) {
            // Determine the display name and avatar depending on role
            // If user is acting as buyer, the chat name is the Shop name.
            // If user is acting as seller, the chat name is the Buyer name.
            $isSellerInThisChat = $shopId && $chat->shop_id === $shopId;
            
            return [
                'id' => $chat->id,
                'is_seller' => $isSellerInThisChat,
                'target_shop_id' => $chat->shop_id,
                'target_name' => $isSellerInThisChat ? $chat->user->name : $chat->shop->nama_toko,
                'target_avatar' => $isSellerInThisChat 
                    ? ($chat->user->avatar ? '/storage/' . $chat->user->avatar : '') 
                    : ($chat->shop->foto_profil ? '/storage/' . $chat->shop->foto_profil : ''),
                'latest_message' => $chat->latestMessage ? $chat->latestMessage->message : 'Mulai percakapan',
                'latest_time' => $chat->latestMessage ? $chat->latestMessage->created_at->format('H:i') : '',
                'unread_count' => $isSellerInThisChat ? $chat->unread_as_seller : $chat->unread_as_buyer
            ];
        });

        return response()->json(['chats' => $chats]);
    }

    // Membuka room / memastikan ada room chat dgn Shop
    public function store(Request $request)
    {
        $request->validate(['shop_id' => 'required|exists:shops,id']);
        
        $chat = Chat::firstOrCreate([
            'user_id' => $request->user()->id,
            'shop_id' => $request->shop_id
        ]);

        return response()->json(['chat' => $chat]);
    }

    // Menarik semua riwayat pesan dari room spesifik
    public function show(Request $request, $id)
    {
        $chat = Chat::with(['user', 'shop'])->findOrFail($id);

        $user = $request->user();
        $shopId = $user->shop ? $user->shop->id : null;

        // Check permission
        $isSellerInThisChat = $shopId && $chat->shop_id === $shopId;
        if ($chat->user_id !== $user->id && !$isSellerInThisChat) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Mark incoming messages as read
        ChatMessage::where('chat_id', $chat->id)
            ->where('is_read', false)
            ->where('sender_type', $isSellerInThisChat ? 'user' : 'shop')
            ->update(['is_read' => true]);

        $messages = ChatMessage::where('chat_id', $chat->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'chat' => $chat,
            'messages' => $messages
        ]);
    }

    // Mengirim Pesan
    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
            'as_shop' => 'boolean'
        ]);

        $chat = Chat::findOrFail($id);
        $user = $request->user();
        
        $asShop = $request->as_shop ?? false;
        $senderType = 'user';

        if ($asShop) {
            $shopId = $user->shop ? $user->shop->id : null;
            if ($chat->shop_id !== $shopId) {
                return response()->json(['message' => 'Not your shop'], 403);
            }
            $senderType = 'shop';
        } else {
            if ($chat->user_id !== $user->id) {
                return response()->json(['message' => 'Not your chat'], 403);
            }
        }

        $msg = ChatMessage::create([
            'chat_id' => $chat->id,
            'sender_type' => $senderType,
            'message' => $request->message
        ]);

        broadcast(new \App\Events\MessageSent($msg, $chat->id))->toOthers();

        return response()->json([
            'message' => 'Terkirim',
            'data' => $msg
        ]);
    }

    public function unreadCount(Request $request)
    {
        $user = $request->user();
        $shopId = $user->shop ? $user->shop->id : null;

        $userUnread = \App\Models\ChatMessage::where('is_read', false)
            ->where('sender_type', 'shop')
            ->whereHas('chat', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count();

        $shopUnread = 0;
        if ($shopId) {
            $shopUnread = \App\Models\ChatMessage::where('is_read', false)
                ->where('sender_type', 'user')
                ->whereHas('chat', function($q) use ($shopId) {
                    $q->where('shop_id', $shopId);
                })->count();
        }

        return response()->json(['unread_count' => $userUnread + $shopUnread]);
    }
}
