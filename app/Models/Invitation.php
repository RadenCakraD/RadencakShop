<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'email',
        'role',
        'shop_id',
        'token',
        'status',
    ];

    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
    public function inviter() { return $this->belongsTo(User::class, 'sender_id'); }
    public function shop() { return $this->belongsTo(Shop::class); }
}
