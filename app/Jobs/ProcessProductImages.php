<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProcessProductImages implements ShouldQueue
{
    use Queueable;

    public $productId;
    public $imagePaths;
    public $variantPaths;

    /**
     * Create a new job instance.
     */
    public function __construct($productId, $imagePaths = [], $variantPaths = [])
    {
        $this->productId = $productId;
        $this->imagePaths = $imagePaths;
        $this->variantPaths = $variantPaths;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $manager = new ImageManager(new Driver());
        
        // Process Product Images
        foreach ($this->imagePaths as $path) {
            $fullPath = storage_path('app/public/' . $path);
            if (file_exists($fullPath)) {
                $image = $manager->read($fullPath);
                $image->scaleDown(1200, 1200);
                $encoded = $image->toJpeg(75);
                Storage::disk('public')->put($path, (string) $encoded);
            }
        }
        
        // Process Variant Images
        foreach ($this->variantPaths as $path) {
            $fullPath = storage_path('app/public/' . $path);
            if (file_exists($fullPath)) {
                $image = $manager->read($fullPath);
                $image->scaleDown(1200, 1200);
                $encoded = $image->toJpeg(75);
                Storage::disk('public')->put($path, (string) $encoded);
            }
        }
    }
}
