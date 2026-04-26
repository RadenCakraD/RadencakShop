<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Complaint;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $complaints = Complaint::where('user_id', $request->user()->id)->latest()->get();
        return response()->json($complaints);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'order_id' => 'nullable|exists:orders,id'
        ]);

        $complaint = Complaint::create([
            'user_id' => $request->user()->id,
            'order_id' => $request->order_id,
            'subject' => $request->subject,
            'message' => $request->message,
            'status' => 'open'
        ]);

        return response()->json(['message' => 'Pengaduan berhasil dikirim!', 'complaint' => $complaint], 201);
    }

    public function adminIndex()
    {
        return response()->json(\App\Models\Complaint::with('user')->latest()->get());
    }

    public function resolve($id)
    {
        $complaint = \App\Models\Complaint::findOrFail($id);
        $complaint->status = 'resolved';
        $complaint->save();
        return response()->json(['message' => 'Pengaduan berhasil diselesaikan!']);
    }
}
