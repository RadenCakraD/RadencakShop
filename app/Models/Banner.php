<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'image_url',
        'title',
        'description',
        'link_url',
        'is_active',
        'position',
    ];

    protected $appends = ['full_url'];

    public function getFullUrlAttribute()
    {
        if (!empty($this->image_url)) {
            if (str_starts_with($this->image_url, 'http')) return $this->image_url;
            return asset('storage/' . $this->image_url);
        }
        return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop";
    }
}
