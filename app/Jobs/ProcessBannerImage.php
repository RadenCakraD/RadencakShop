<?php

namespace App\Jobs;

use App\Models\Banner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProcessBannerImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $bannerId;
    protected $imagePath;

    /**
     * Create a new job instance.
     */
    public function __construct($bannerId, $imagePath)
    {
        $this->bannerId = $bannerId;
        $this->imagePath = $imagePath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $banner = Banner::find($this->bannerId);
        if (!$banner) return;

        $fullPath = storage_path('app/public/' . $this->imagePath);
        if (!file_exists($fullPath)) return;

        $manager = new ImageManager(new Driver());
        $image = $manager->read($fullPath);

        // Advanced Compression: Resize and WebP
        $image->scaleDown(1920, 1080);
        $webpPath = 'banners/' . uniqid() . '.webp';
        $encoded = $image->toWebp(75);
        
        Storage::disk('public')->put($webpPath, (string) $encoded);

        // Clean up old JPG/Original
        Storage::disk('public')->delete($this->imagePath);

        // Update banner with optimized path
        $banner->update(['image_url' => $webpPath]);
        
        \Illuminate\Support\Facades\Cache::forget('banners.active');
    }
}
