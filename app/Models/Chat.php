<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function shop() { return $this->belongsTo(Shop::class); }
    public function messages() { return $this->hasMany(ChatMessage::class); }
    public function latestMessage() { return $this->hasOne(ChatMessage::class)->latestOfMany(); }
}
