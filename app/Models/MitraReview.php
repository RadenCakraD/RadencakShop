<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MitraReview extends Model
{
    protected $guarded = [];

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function mitra()
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }
}
