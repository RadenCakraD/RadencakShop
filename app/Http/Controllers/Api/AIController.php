<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Cart;
use App\Models\Voucher;
use App\Models\UserAddress;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AIController extends Controller
{
    /**
     * Endpoint Chat Raden AI - Smart Shopping Assistant.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'product_id' => 'nullable|integer|exists:products,id',
            'tab_id' => 'nullable|string'
        ]);

        $user = $request->user();
        $message = $request->message;
        $lowerMsg = strtolower($message);
        $tabId = $request->input('tab_id', 'default');
        $cacheKey = 'last_interacted_product_id_' . $user->id . '_' . $tabId;

        // Muat data produk aktif (dari halaman detail produk jika ada)
        $activeProduct = null;
        if ($request->filled('product_id')) {
            $activeProduct = Product::with(['images', 'shop', 'reviews.user', 'variants'])->find($request->product_id);
            // Simpan produk aktif ini ke Cache sebagai produk terakhir yang dibahas (Stateful)
            Cache::put($cacheKey, $activeProduct->id, 1800); // Bertahan 30 menit
        }

        // Ambil ID produk terakhir dari Cache
        $lastProductId = Cache::get($cacheKey);

        // 1. Cek jika pengguna menyatakan persetujuan tambah keranjang (Affirmative Action) ATAU menyebutkan varian langsung
        if ($lastProductId) {
            $product = Product::with('variants')->find($lastProductId);
            if ($product && ($this->isAffirmativeAction($lowerMsg) || $this->isVariantSpecified($lowerMsg, $product))) {
                // Tentukan jumlah barang (default = 1)
                $qty = 1;
                if (preg_match('/(\d+)\s*(unit|pcs|buah|biji|barang|item)?/', $message, $matches)) {
                    $qty = intval($matches[1]);
                }
                return $this->executeAddToCartWithVariantCheck($product, $qty, $user, $message, $tabId);
            }
        }

        // 2. Cek jika pengguna menyatakan penolakan (Negative Action)
        if ($lastProductId && $this->isNegativeAction($lowerMsg)) {
            // Hapus cache memori produk terakhir
            Cache::forget($cacheKey);
            return response()->json([
                'reply' => "Baik, tidak apa-apa! 😊 Jika Anda ingin mencari produk lain atau membutuhkan bantuan estimasi ongkos kirim dan diskon voucher, silakan beri tahu saya ya! Saya selalu siap mendampingi belanja Anda. 🛍️✨"
            ]);
        }

        // 3. Jika ada produk aktif dan pertanyaannya spesifik tentang produk tersebut
        if ($activeProduct && $this->hasKeywords($lowerMsg, ['harga', 'diskon', 'promo', 'murah', 'mahal', 'bayar', 'ulasan', 'review', 'rating', 'bintang', 'bagus', 'toko', 'penjual', 'alamat', 'seller', 'slogan', 'deskripsi', 'tentang', 'spesifikasi', 'varian', 'bahan', 'keterangan'])) {
            $contextReply = $this->handleActiveProductQuery($message, $activeProduct);
            if ($contextReply) {
                return $contextReply;
            }
        }

        // 4. Intent Detection (Pendeteksian Maksud Pengguna untuk Fitur Keranjang Cerdas)
        
        // A. Aksi Tambah ke Keranjang (Hanya kata kerja aktif, hindari overlap kata 'keranjang' polos)
        if ($this->hasKeywords($lowerMsg, ['masukkan', 'tambahkan', 'masukin', 'tambah ke', 'tambahkan ke', 'add to cart', 'beli'])) {
            return $this->handleAddToCart($message, $user, $tabId);
        }

        // B. Aksi Hapus dari Keranjang
        if ($this->hasKeywords($lowerMsg, ['hapus', 'buang', 'keluarkan', 'hilangkan', 'delete', 'remove', 'kurangi', 'kurangkan'])) {
            return $this->handleRemoveFromCart($message, $user);
        }
        
        // C. Aksi Ubah Kuantitas
        if ($this->hasKeywords($lowerMsg, ['ubah', 'ganti', 'edit', 'set', 'menjadi', 'update'])) {
            return $this->handleUpdateCartQuantity($message, $user);
        }
        
        // D. Aksi Kosongkan Keranjang
        if ($this->hasKeywords($lowerMsg, ['kosongkan', 'bersihkan', 'clear', 'kosongin', 'hapus semua'])) {
            return $this->handleClearCart($user);
        }

        // E. Aksi Tinjau / Lihat Isi Keranjang (Ditampilkan saat user menanyakan keranjang mereka)
        if ($this->hasKeywords($lowerMsg, ['total', 'hitung', 'isi keranjang', 'belanjaan saya', 'belanjaanku', 'jumlah belanja', 'keranjang saya', 'keranjangku', 'keranjang'])) {
            return $this->handleCartTotal($user);
        } 
        
        // F. Pencarian Produk Semantik
        if ($this->hasKeywords($lowerMsg, ['cari', 'tunjukkan', 'temukan', 'rekomendasi', 'butuh', 'ada produk', 'jual'])) {
            return $this->handleProductSearch($message, $user, $tabId);
        } 
        
        // G. Rekomendasi Voucher
        if ($this->hasKeywords($lowerMsg, ['voucher', 'diskon', 'kupon', 'promo', 'potongan'])) {
            return $this->handleVoucherRecommendation($user);
        } 
        
        // H. Estimasi Ongkir Wilayah
        if ($this->hasKeywords($lowerMsg, ['ongkir', 'ongkos kirim', 'kirim', 'pengiriman', 'kurir', 'reguler', 'cepat', 'santai'])) {
            return $this->handleShippingRecommendation($user, $message);
        }

        // I. Direct Checkout Concierge
        if ($this->hasKeywords($lowerMsg, ['checkout', 'bayar', 'selesai', 'payment', 'pembayaran', 'selesaikan', 'kasir'])) {
            return $this->handleDirectCheckout($user);
        }

        // Fallback: Analisis kueri secara semantik (bisa pencarian produk atau percakapan umum)
        return $this->handleGeneralQuery($message, $user, $activeProduct, $tabId);
    }

    /**
     * Memeriksa kedekatan kata untuk toleransi salah ketik (anti-typo) menggunakan Levenshtein.
     */
    private function isFuzzyMatch($userInput, $targetKeyword)
    {
        $userInput = trim(strtolower($userInput));
        $targetKeyword = trim(strtolower($targetKeyword));

        if ($userInput === $targetKeyword) {
            return true;
        }

        $dist = @levenshtein($userInput, $targetKeyword);
        $maxLength = max(strlen($userInput), strlen($targetKeyword));

        if ($maxLength === 0) return false;

        $similarity = 1 - ($dist / $maxLength);
        // Toleransi: kemiripan >= 75% atau edit distance <= 2 untuk kata panjang
        if ($similarity >= 0.75 || ($dist <= 2 && strlen($targetKeyword) > 4)) {
            return true;
        }

        return false;
    }

    /**
     * Memeriksa apakah input adalah aksi setuju / affirmative untuk memasukkan barang terakhir ke keranjang tanpa basa-basi.
     */
    private function isAffirmativeAction($lowerMsg)
    {
        // Masukan bernada setuju / perintah mengiyakan penawaran tanpa bertele-tele
        $affirmativeWords = [
            'iya', 'ya', 'boleh', 'masukkan', 'tambahkan', 'ok', 'oke', 'yes', 'masukin', 
            'mau', 'boleh deh', 'sip', 'tambah', 'beli', 'gass', 'gas', 'yoi', 'sikat', 
            'boleh dong', 'mau dong', 'ambil', 'okey', 'deal', 'muat', 'okey deh', 'yo',
            'hooh', 'yup', 'yess', 'okelah', 'bolehh', 'iyap'
        ];
        
        // Bersihkan tanda baca dari lowerMsg agar kecocokan kata tunggal presisi
        $cleanMsg = trim(preg_replace('/[^\w\s]/u', '', $lowerMsg));

        if (in_array($cleanMsg, $affirmativeWords)) {
            return true;
        }

        // Juga jika mengandung frasa persetujuan umum
        $affirmativePhrases = [
            'masukkan ke keranjang', 'tambah ke keranjang', 'masukkan dong', 'tambahkan dong', 
            'iya masukkan', 'ya masukkan', 'ok masukkan', 'boleh masukkan', 'masukin aja',
            'sikat aja', 'gas masukkan', 'gass masukkan', 'masukkan yang ini', 'tambahkan ini',
            'tambahin aja', 'ambil ini', 'beli yang ini', 'masuk keranjang', 'masukin keranjang'
        ];
        foreach ($affirmativePhrases as $phrase) {
            if (str_contains($lowerMsg, $phrase)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Memeriksa apakah pengguna secara khusus menyebutkan salah satu varian dari produk terakhir yang dibahas.
     */
    private function isVariantSpecified($lowerMsg, $product)
    {
        if (!$product->variants || $product->variants->isEmpty()) {
            return false;
        }

        foreach ($product->variants as $v) {
            $variantNameLower = strtolower($v->nama_jenis);
            if (in_array($variantNameLower, ['s', 'm', 'l', 'xl', 'xxl'])) {
                if (preg_match('/\b' . $variantNameLower . '\b/i', $lowerMsg)) {
                    return true;
                }
            } else {
                if (str_contains($lowerMsg, $variantNameLower)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Memeriksa apakah input adalah aksi penolakan (Negative Action) seperti 'tidak' atau 'nanti'.
     */
    private function isNegativeAction($lowerMsg)
    {
        $negativeWords = ['tidak', 'nggak', 'gak', 'enggak', 'no', 'nanti', 'nanti saja', 'gamau', 'ogah', 'jangan', 'batal', 'cancel', 'tidak usah', 'gausah', 'batalin', 'jangan deh', 'belum', 'belom'];
        $cleanMsg = trim(preg_replace('/[^\w\s]/u', '', $lowerMsg));

        if (in_array($cleanMsg, $negativeWords)) {
            return true;
        }

        foreach ($negativeWords as $word) {
            if (str_contains($lowerMsg, $word)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Memeriksa keberadaan kata kunci dalam kalimat dengan toleransi anti-typo fuzzy.
     */
    private function hasKeywords($str, $keywords)
    {
        $words = explode(' ', $str);
        
        foreach ($keywords as $kw) {
            // Cocok persis substring
            if (str_contains($str, $kw)) {
                return true;
            }
            
            // Cocok fuzzy per kata
            foreach ($words as $w) {
                $cleanW = trim(preg_replace('/[^\w]/u', '', $w));
                if (strlen($cleanW) > 2 && $this->isFuzzyMatch($cleanW, $kw)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Pembersihan teks kueri dari simbol.
     */
    private function cleanText($text)
    {
        $text = strtolower($text);
        $text = preg_replace('/[^\w\s]/u', '', $text);
        return trim($text);
    }

    /**
     * Kueri Kontekstual Halaman Produk Detail Aktif dengan Bahasa Mewah & Premium.
     */
    private function handleActiveProductQuery($message, $product)
    {
        $query = strtolower($message);
        $formatRp = function($num) {
            return 'Rp' . number_format($num, 0, ',', '.');
        };

        // a. Kueri Harga & Diskon
        if ($this->hasKeywords($query, ['harga', 'diskon', 'promo', 'murah', 'mahal', 'bayar'])) {
            $displayPrice = (float) ($product->harga_jual ?? 0);
            $displayOriginal = (float) ($product->harga_dasar ?? 0) > 0 ? (float) $product->harga_dasar : $displayPrice;
            $discount = $displayOriginal > $displayPrice ? (int) round((($displayOriginal - $displayPrice) / $displayOriginal) * 100) : 0;
            
            $reply = "✨ *Penawaran Eksklusif Terkini untuk Anda!* ✨\n\n";
            $reply .= "![{$product->nama_produk}]({$product->primary_image})\n\n";
            $reply .= "🛍️ **{$product->nama_produk}**\n\n";
            if ($discount > 0) {
                $reply .= "🔥 **Spesial Hari Ini: Diskon Super {$discount}%!**\n";
                $reply .= "• Harga Normal: ~~{$formatRp($displayOriginal)}~~\n";
                $reply .= "• **Harga Terbaik Anda: {$formatRp($displayPrice)}**\n\n";
                $reply .= "💡 *Keputusan yang sangat cerdas!* Dengan memesan sekarang, Anda otomatis menghemat anggaran belanja hingga **{$formatRp($displayOriginal - $displayPrice)}**! Penghematan yang luar biasa untuk produk premium. 💸✨";
            } else {
                $reply .= "💰 **Harga Terbaik: {$formatRp($displayPrice)}**\n\n";
                $reply .= "Produk ini merupakan koleksi original eksklusif dari merchant resmi kami. Nilai investasi belanja yang sangat sepadan dengan kemewahan mutu dan kualitasnya! 🌟";
            }
            
            if ($product->stok > 0) {
                $reply .= "\n\n📦 *Informasi Ketersediaan:* Stok saat ini aman tersedia sebanyak **{$product->stok}** unit. Segera amankan pesanan Anda sebelum kehabisan! 😊";
            }
            return response()->json(['reply' => $reply]);
        }

        // b. Kueri Ulasan / Rating
        if ($this->hasKeywords($query, ['ulasan', 'review', 'rating', 'bintang', 'bagus'])) {
            $reviews = $product->reviews;
            $totalReviews = $reviews->count();
            $avgRating = $totalReviews > 0 ? number_format($reviews->avg('rating'), 1) : '0.0';
                
            $reply = "⭐ *Ulasan & Reputasi Produk Terpercaya* ⭐\n\n";
            $reply .= "![{$product->nama_produk}]({$product->primary_image})\n\n";
            $reply .= "🛍️ **{$product->nama_produk}**\n";
            $reply .= "• Rata-rata Penilaian: ⭐ **{$avgRating} / 5.0** (dari {$totalReviews} ulasan nyata pembeli)\n\n";
            
            if ($totalReviews > 0) {
                $reply .= "💬 **Apa Kata Pelanggan Kami yang Puas?**\n";
                $sampleReviews = $reviews->filter(fn($r) => !empty($r->comment))->take(3);
                if ($sampleReviews->isNotEmpty()) {
                    foreach ($sampleReviews as $r) {
                        $stars = str_repeat("⭐", $r->rating);
                        $userName = $r->user ? $r->user->name : 'Pelanggan Terhormat';
                        $reply .= "• _\"{$r->comment}\"_ ({$stars} oleh **{$userName}**)\n";
                    }
                } else {
                    $reply .= "• Seluruh pembeli memberikan penilaian bintang tinggi secara keseluruhan tanpa meninggalkan teks ulasan tertulis. Mutu barang dijamin memuaskan! ✨\n";
                }
            } else {
                $reply .= "✨ Produk istimewa ini baru saja diluncurkan dan belum memiliki ulasan dari pembeli pertama. Jadilah pelanggan terhormat pertama yang menikmati keunggulan produk ini dan tinggalkan ulasan positif Anda! 😊";
            }
            return response()->json(['reply' => $reply]);
        }

        // c. Kueri Toko / Alamat Toko
        if ($this->hasKeywords($query, ['toko', 'penjual', 'alamat', 'seller', 'slogan'])) {
            $shop = $product->shop;
            if (!$shop) return response()->json(['reply' => "Maaf, saya tidak dapat menemukan data toko yang menyediakan produk ini."]);
            
            $reply = "🏪 *Profil Mitra Resmi Merchant* 🏪\n\n";
            $reply .= "Nama Toko Mitra: **{$shop->nama_toko}**\n";
            if ($shop->shop_tier === 'raden') {
                $reply .= "👑 **Status Kemitraan: Premium Gold Merchant (Raden Seller)**\n";
            }
            if ($shop->alamat_toko) {
                $reply .= "📍 Lokasi Operasional: **{$shop->alamat_toko}**\n";
            }
            if ($shop->slogan) {
                $reply .= "✨ Slogan Toko: _\"{$shop->slogan}\"_\n";
            }
            if ($shop->deskripsi_toko) {
                $reply .= "\n📝 **Tentang Toko:**\n\"{$shop->deskripsi_toko}\"\n\n";
            } else {
                $reply .= "\n📝 Toko terverifikasi ini merupakan salah satu pilar niaga Radencak Shop yang dikenal memiliki reputasi pelayanan respons cepat dan jaminan kepuasan pelanggan 100%.\n\n";
            }
            $reply .= "🛡️ *Belanja Tenang:* Seluruh transaksi Anda dengan toko mitra dilindungi penuh oleh garansi keamanan Radencak Shop.";
            return response()->json(['reply' => $reply]);
        }

        // d. Kueri Deskripsi / Varian / Spesifikasi
        if ($this->hasKeywords($query, ['deskripsi', 'tentang', 'apa', 'spesifikasi', 'varian', 'bahan', 'keterangan'])) {
            $reply = "📝 *Keterangan Eksklusif & Spesifikasi Produk* 📝\n\n";
            $reply .= "![{$product->nama_produk}]({$product->primary_image})\n\n";
            $reply .= "🛍️ **{$product->nama_produk}**\n\n";
            
            if ($product->deskripsi) {
                $reply .= "📋 **Deskripsi Detail:**\n" . substr($product->deskripsi, 0, 420);
                if (strlen($product->deskripsi) > 420) $reply .= "... *(selengkapnya dapat Anda baca pada kolom keterangan produk)*";
            } else {
                $reply .= "Belum ada rincian deskripsi spesifik yang tertulis untuk produk ini.";
            }

            if ($product->variants && $product->variants->count() > 0) {
                $reply .= "\n\n⚙️ **Pilihan Varian Mewah yang Tersedia:**\n";
                foreach ($product->variants as $v) {
                    $reply .= "• **{$v->nama_jenis}** (Stok: {$v->stok} unit - {$formatRp($v->harga_jual)})\n";
                }
            }
            
            if ($product->kategori) {
                $reply .= "\n🏷️ Kategori Koleksi: **{$product->kategori}**";
            }
            return response()->json(['reply' => $reply]);
        }

        return null;
    }

    /**
     * 1. FITUR: Pencarian Produk Semantik (Semantic & Keyword Scoring) dengan Gambar Visual.
     */
    private function handleProductSearch($message, $user, $tabId = 'default')
    {
        $cleanQuery = $this->cleanText($message);
        
        $stopWords = [
            'cari', 'tunjukkan', 'temukan', 'rekomendasi', 'butuh', 'ada', 'yang', 'dengan', 
            'saya', 'dong', 'tolong', 'produk', 'barang', 'item', 'jual', 'beli', 'warna', 'ukuran'
        ];
        
        $keywords = array_filter(explode(' ', $cleanQuery), function($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        if (empty($keywords)) {
            return response()->json([
                'reply' => "Silakan sebutkan produk atau kriteria spesifik yang ingin Anda temukan (contoh: *'cari baju batik premium'* atau *'sepatu olahraga hitam'*). 🛍️"
            ]);
        }

        $products = Product::with(['images', 'shop'])->get();
        $scored = [];

        foreach ($products as $product) {
            $score = 0;
            $nameLower = strtolower($product->nama_produk);
            $descLower = strtolower($product->deskripsi);
            $catLower = strtolower($product->kategori);

            foreach ($keywords as $kw) {
                if (str_contains($nameLower, $kw)) {
                    $score += 15;
                }
                if (str_contains($catLower, $kw)) {
                    $score += 8;
                }
                if (str_contains($descLower, $kw)) {
                    $score += 3;
                }
            }

            if ($score > 0) {
                $scored[] = [
                    'product' => $product,
                    'score' => $score
                ];
            }
        }

        usort($scored, function($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        $topScored = array_slice($scored, 0, 3);

        if (empty($topScored)) {
            return response()->json([
                'reply' => "Maaf, Raden AI belum menemukan produk yang cocok dengan kata kunci **\"" . implode(' ', $keywords) . "\"**. \n\nCoba ketik deskripsi produk lain yang lebih umum, saya siap mencari ulang untuk Anda! 🔍"
            ]);
        }

        $reply = "🔍 *Hasil Analisis Semantik Produk Raden AI* 🔍\n\n";
        $reply .= "Saya telah memfilter **koleksi terbaik** yang paling selaras dengan kriteria pencarian Anda:\n\n";
        $productsData = [];
        
        foreach ($topScored as $item) {
            $prod = $item['product'];
            $price = number_format($prod->harga_jual, 0, ',', '.');
            $ratingAvg = $prod->reviews->count() > 0 ? number_format($prod->reviews->avg('rating'), 1) : null;
            
            // Sertakan format markdown gambar produk resmi
            $reply .= "![{$prod->nama_produk}]({$prod->primary_image})\n";
            $reply .= "🛍️ **{$prod->nama_produk}**\n";
            $reply .= "• Harga Terbaik: **IDR {$price}**\n";
            $reply .= "• Merchant Toko: *{$prod->shop->nama_toko}* (📍 {$prod->shop->alamat_toko})\n";
            $reply .= "• Penilaian: " . ($ratingAvg ? "⭐ **{$ratingAvg} / 5.0**" : "⭐ Belum ada ulasan") . "\n";
            $reply .= "👉 [Buka Detail Produk Resmi](/product/{$prod->slug})\n\n";

            $productsData[] = [
                'id' => $prod->id,
                'nama_produk' => $prod->nama_produk,
                'harga_jual' => $prod->harga_jual,
                'slug' => $prod->slug,
                'shop_name' => $prod->shop->nama_toko,
                'image_url' => $prod->primary_image
            ];
        }

        // Simpan produk hasil pencarian teratas ke Cache (Stateful Stateless-Proof)
        Cache::put('last_interacted_product_id_' . $user->id . '_' . $tabId, $topScored[0]['product']->id, 1800);

        $reply .= "💡 *Asisten Belanja Cerdas:* Apakah Anda ingin saya memasukkan produk teratas di atas langsung ke keranjang belanja Anda? Cukup balas: **\"Iya\"** atau **\"Boleh\"**! 🛒";

        return response()->json([
            'reply' => $reply,
            'products' => $productsData
        ]);
    }

    /**
     * 2. FITUR: Mengitung Total Keranjang Belanja Riil dengan Rincian Indah.
     */
    private function handleCartTotal($user)
    {
        $cartItems = Cart::with(['product', 'variant'])->where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda saat ini masih kosong melompong. Yuk, mari kita cari beberapa produk impian Anda lalu ketik *'masukkan [nama barang] ke keranjang'* untuk memulai belanja cerdas! 🛒✨"
            ]);
        }

        $reply = "📊 *Tinjauan Eksklusif Keranjang Belanja Anda* 📊\n\n";
        $reply .= "Berikut adalah daftar produk premium yang sedang Anda persiapkan untuk dibeli:\n\n";
        $subtotal = 0;
        $totalItems = 0;

        foreach ($cartItems as $item) {
            $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
            $itemTotal = $price * $item->qty;
            $subtotal += $itemTotal;
            $totalItems += $item->qty;
            
            $variantName = $item->variant ? " (Varian: *{$item->variant->nama_jenis}*)" : "";
            $priceFmt = number_format($price, 0, ',', '.');
            $totalFmt = number_format($itemTotal, 0, ',', '.');
            
            $reply .= "![{$item->product->nama_produk}]({$item->product->primary_image})\n";
            $reply .= "🛒 **{$item->product->nama_produk}**{$variantName}\n";
            $reply .= "  • Kuantitas: **{$item->qty} unit** x IDR {$priceFmt} = **IDR {$totalFmt}**\n\n";
        }

        $subtotalFmt = number_format($subtotal, 0, ',', '.');
        $reply .= "📈 **Ringkasan Anggaran Belanja:**\n";
        $reply .= "• Total Pembelian: **{$totalItems} unit produk**\n";
        $reply .= "• **Subtotal Bersih: IDR {$subtotalFmt}**\n\n";
        $reply .= "🎟 *Rekomendasi Cerdas:* Ingin mendapatkan potongan harga instan? Ketik *'rekomendasi voucher'* agar saya carikan diskon kupon terbaik untuk Anda!";

        return response()->json([
            'reply' => $reply,
            'subtotal' => $subtotal,
            'total_items' => $totalItems
        ]);
    }

    /**
     * 3. FITUR: Rekomendasi Voucher Terbaik (Berdasarkan Syarat Keranjang Aktif + Spend-Gap Analysis).
     */
    private function handleVoucherRecommendation($user)
    {
        $cartItems = Cart::with(['product', 'variant'])->where('user_id', $user->id)->get();
        
        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda kosong, sehingga saya belum bisa menganalisis kecocokan kupon voucher. Silakan isi keranjang belanja Anda terlebih dahulu ya! 🛒"
            ]);
        }

        $subtotal = 0;
        $shopTotals = [];
        foreach ($cartItems as $item) {
            $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
            $itemCost = $price * $item->qty;
            $subtotal += $itemCost;
            
            $shopId = $item->product->shop_id;
            if (!isset($shopTotals[$shopId])) {
                $shopTotals[$shopId] = 0;
            }
            $shopTotals[$shopId] += $itemCost;
        }

        $vouchers = Voucher::where('valid_until', '>=', now()->toDateString())->get();

        if ($vouchers->isEmpty()) {
            return response()->json([
                'reply' => "Saat ini belum ada voucher promo yang aktif di database kami. Terus pantau info dari kami untuk event belanja hemat selanjutnya! 🎟️"
            ]);
        }

        $bestVoucher = null;
        $maxDiscount = 0;
        $matchingVouchers = [];
        $unqualifiedVouchers = [];

        foreach ($vouchers as $voucher) {
            $applicableAmount = ($voucher->shop_id === null) ? $subtotal : ($shopTotals[$voucher->shop_id] ?? 0);

            if ($applicableAmount >= $voucher->min_purchase) {
                $discount = ($voucher->type === 'percentage') 
                    ? ($voucher->value / 100) * $applicableAmount 
                    : $voucher->value;

                $discount = min($discount, $applicableAmount);

                $matchingVouchers[] = [
                    'code' => $voucher->code,
                    'discount' => $discount,
                    'min_purchase' => $voucher->min_purchase,
                    'desc' => $voucher->type === 'percentage' 
                        ? "Potongan {$voucher->value}% (Min. Rp" . number_format($voucher->min_purchase, 0, ',', '.') . ")"
                        : "Potongan Rp" . number_format($voucher->value, 0, ',', '.') . " (Min. Rp" . number_format($voucher->min_purchase, 0, ',', '.') . ")"
                ];

                if ($discount > $maxDiscount) {
                    $maxDiscount = $discount;
                    $bestVoucher = $voucher;
                }
            } else {
                // Hitung nominal kurang (Spend-Gap)
                $gap = $voucher->min_purchase - $applicableAmount;
                $unqualifiedVouchers[] = [
                    'code' => $voucher->code,
                    'gap' => $gap,
                    'min_purchase' => $voucher->min_purchase,
                    'desc' => $voucher->type === 'percentage' 
                        ? "Potongan {$voucher->value}% (Min. Rp" . number_format($voucher->min_purchase, 0, ',', '.') . ")"
                        : "Potongan Rp" . number_format($voucher->value, 0, ',', '.') . " (Min. Rp" . number_format($voucher->min_purchase, 0, ',', '.') . ")"
                ];
            }
        }

        if ($bestVoucher) {
            $maxDiscountFmt = number_format($maxDiscount, 0, ',', '.');
            $reply = "🎟️ *Analisis Promo Voucher Terbaik Raden AI* 🎟️\n\n";
            $reply .= "Kabar gembira! Saya sangat merekomendasikan kode kupon **\"{$bestVoucher->code}\"** saat pembayaran untuk menghemat belanjaan Anda sebesar **-IDR {$maxDiscountFmt}**! 🎉\n\n";
            
            $reply .= "📋 **Daftar Voucher yang Memenuhi Kualifikasi Keranjang Anda:**\n";
            foreach ($matchingVouchers as $v) {
                $discFmt = number_format($v['discount'], 0, ',', '.');
                $reply .= "• Kode **{$v['code']}** (Hemat IDR {$discFmt}) - _{$v['desc']}_\n";
            }

            if (!empty($unqualifiedVouchers)) {
                $reply .= "\n⚠️ **Voucher Lain yang Sedikit Lagi Bisa Diaktifkan:**\n";
                foreach ($unqualifiedVouchers as $uv) {
                    $gapFmt = number_format($uv['gap'], 0, ',', '.');
                    $reply .= "• Kode **{$uv['code']}** (_{$uv['desc']}_) - *Kurang Rp{$gapFmt} lagi!* 💸\n";
                }
                
                // Urutkan berdasarkan gap terkecil untuk up-selling persuasif
                usort($unqualifiedVouchers, fn($a, $b) => $a['gap'] <=> $b['gap']);
                $cheapestGap = $unqualifiedVouchers[0];
                $gapFmt = number_format($cheapestGap['gap'], 0, ',', '.');
                $reply .= "\n💡 *Tips Hemat Belanja:* Anda hanya perlu menambah belanjaan sebesar **IDR {$gapFmt}** lagi untuk mengaktifkan voucher diskon **\"{$cheapestGap['code']}\"**! Tambahkan beberapa produk menarik lagi yuk agar belanja Anda jauh lebih hemat! 🛍️";
            } else {
                $reply .= "\n✨ *Tips Cerdas:* Anda tinggal memasukkan kode promo tersebut di kolom voucher pada halaman checkout untuk langsung memotong total tagihan belanjaan Anda!";
            }
        } else {
            $reply = "🎟️ *Status Promo Voucher Aktif* 🎟️\n\n";
            $reply .= "Nilai subtotal belanja Anda saat ini (IDR " . number_format($subtotal, 0, ',', '.') . ") belum mencapai kriteria minimal belanja kupon voucher yang ada.\n\n";
            $reply .= "Berikut adalah daftar voucher aktif beserta selisih belanja yang perlu Anda tambahkan:\n";
            
            foreach ($unqualifiedVouchers as $uv) {
                $gapFmt = number_format($uv['gap'], 0, ',', '.');
                $reply .= "• **{$uv['code']}**: _{$uv['desc']}_ - *Kurang Rp{$gapFmt} untuk aktif!* ⚠️\n";
            }

            // Up-selling persuasif gap terkecil
            usort($unqualifiedVouchers, fn($a, $b) => $a['gap'] <=> $b['gap']);
            $cheapestGap = $unqualifiedVouchers[0];
            $gapFmt = number_format($cheapestGap['gap'], 0, ',', '.');
            $reply .= "\n💡 *Saran Asisten:* Tambahkan produk bernilai **IDR {$gapFmt}** atau lebih ke keranjang belanja Anda agar Anda bisa berbelanja jauh lebih hemat dengan memanfaatkan voucher **\"{$cheapestGap['code']}\"**! 🛍️";
        }

        return response()->json([
            'reply' => $reply,
            'best_voucher' => $bestVoucher ? $bestVoucher->code : null,
            'max_discount' => $maxDiscount
        ]);
    }

    /**
     * 4. FITUR: Estimasi Ongkir (Santai vs Cepat) - Mendukung Alamat Terdaftar maupun Simulasi Daerah Dinamis.
     */
    private function handleShippingRecommendation($user, $message = '')
    {
        $address = null;
        $region = null;
        $locationName = '';

        // Deteksi apakah ada penyebutan nama daerah tujuan di pesan (contoh: "ongkir ke Lembeyan" atau "kirim ke Doyomulyo")
        if (!empty($message)) {
            if (preg_match('/(?:ke|di|wilayah|untuk)\s+([a-zA-Z\s]{3,})/i', $message, $matches)) {
                $locationName = trim($matches[1]);
                
                // Cari kecocokan daerah di database region secara dinamis (District / Regency / Province)
                $region = \App\Models\Region::where('province', 'LIKE', "%{$locationName}%")
                    ->orWhere('regency', 'LIKE', "%{$locationName}%")
                    ->orWhere('district', 'LIKE', "%{$locationName}%")
                    ->first();
            }
        }

        // Fallback jika tidak dicari secara dinamis atau tidak ditemukan region dinamis
        if (!$region) {
            $address = UserAddress::with('region')->where('user_id', $user->id)->where('is_primary', true)->first();
            if (!$address) {
                $address = UserAddress::with('region')->where('user_id', $user->id)->first();
            }

            if ($address) {
                $region = $address->region;
                $locationName = $address->district . ", " . $address->regency;
            }
        }

        if (!$region) {
            if (!empty($locationName)) {
                return response()->json([
                    'reply' => "📍 **Estimasi Ongkir Dinamis:**\n\nMaaf, saya belum menemukan area operasional kurir resmi untuk wilayah **\"{$locationName}\"** di database kami. Coba pastikan ejaan daerah sudah benar (contoh: *'hitung ongkir ke Lembeyan'* atau *'kirim ke Doyomulyo'*)! 🔍"
                ]);
            }
            return response()->json([
                'reply' => "📍 **Estimasi Ongkir:**\n\nSaya tidak mendeteksi adanya alamat pengiriman terdaftar di akun Anda. Silakan isi alamat pengiriman terlebih dahulu di menu Pengaturan Alamat, atau Anda bisa langsung ketik: *'hitung ongkir ke [nama kecamatan/desa]'* untuk simulasi cepat! 🏠"
            ]);
        }

        $shippingSantai = $region->shipping_fee_santai ?? 10000;
        $shippingCepat = $region->shipping_fee_cepat ?? 15000;

        $targetText = !empty($address) 
            ? "Tujuan Utama Terdaftar: **{$locationName}**"
            : "Simulasi Tujuan Dinamis: **{$region->district}, {$region->regency} ({$region->province})**";

        $reply = "📍 *Simulasi & Perbandingan Ongkos Kirim Wilayah* 📍\n\n";
        $reply .= "{$targetText}\n";
        $reply .= "Berikut adalah opsi logistik resmi terbaik yang siap mengantarkan pesanan Anda:\n\n";
        
        $reply .= "🐢 **1. Opsi Kurir Santai (Reguler)**\n";
        $reply .= "• Ongkos Kirim: **IDR " . number_format($shippingSantai, 0, ',', '.') . "**\n";
        $reply .= "• Waktu Pengiriman: **3 - 5 Hari Kerja**\n";
        $reply .= "• Kelebihan: Pilihan paling hemat! Sangat cocok jika Anda tidak sedang terburu-buru, menghemat biaya sebesar **IDR " . number_format($shippingCepat - $shippingSantai, 0, ',', '.') . "**.\n\n";
        
        $reply .= "🏎️ **2. Opsi Kurir Cepat (Express)**\n";
        $reply .= "• Ongkos Kirim: **IDR " . number_format($shippingCepat, 0, ',', '.') . "**\n";
        $reply .= "• Waktu Pengiriman: **1 - 2 Hari Kerja**\n";
        $reply .= "• Kelebihan: Sangat cepat dan prioritas tinggi. Sangat direkomendasikan jika produk tersebut mendesak untuk segera digunakan!\n\n";

        $reply .= "💡 **Analisis Rekomendasi Raden AI:**\n";
        if (($shippingCepat - $shippingSantai) >= 10000) {
            $reply .= "Saya menyarankan untuk memilih **Kurir Santai** untuk memaksimalkan penghematan belanjaan Anda. Namun, jika efisiensi waktu adalah prioritas Anda, maka **Kurir Cepat** adalah investasi terbaik.";
        } else {
            $reply .= "Karena selisih biaya kedua kurir ini hanya sebesar **IDR " . number_format($shippingCepat - $shippingSantai, 0, ',', '.') . "**, saya sangat merekomendasikan **Kurir Cepat** agar paket berharga Anda tiba di genggaman secara kilat dan ekstra aman!";
        }

        return response()->json([
            'reply' => $reply,
            'shipping_santai' => $shippingSantai,
            'shipping_cepat' => $shippingCepat
        ]);
    }

    /**
     * 5. FITUR: Tambah ke Keranjang Langsung Via Chat (Mendukung Seleksi Varian & Dialog Kontekstual Fallback).
     */
    private function handleAddToCart($message, $user, $tabId = 'default')
    {
        $cleanQuery = $this->cleanText($message);
        $cacheKey = 'last_interacted_product_id_' . $user->id . '_' . $tabId;
        
        $stopWords = [
            'masukkan', 'tambah', 'tambahkan', 'keranjang', 'beli', 'dong', 'tolong', 'ke', 
            'ke dalam', 'produk', 'barang', 'item', 'unit', 'biji', 'buah', 'pcs', 'ukuran', 'varian'
        ];
        
        $keywords = array_filter(explode(' ', $cleanQuery), function($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        // Tentukan kuantitas barang
        $qty = 1;
        if (preg_match('/(\d+)\s*(unit|pcs|buah|biji|barang|item)?/', $message, $matches)) {
            $qty = intval($matches[1]);
        }

        // Jika tidak menyebutkan nama barang secara eksplisit tetapi ada last_interacted_product_id di Cache, gunakan itu!
        if (empty($keywords)) {
            $lastProductId = Cache::get($cacheKey);
            if ($lastProductId) {
                $product = Product::with('variants')->find($lastProductId);
                if ($product) {
                    return $this->executeAddToCartWithVariantCheck($product, $qty, $user, $message, $tabId);
                }
            }
            return response()->json([
                'reply' => "Produk mana yang ingin Anda masukkan ke keranjang? Contoh kueri: *'masukkan baju batik ke keranjang'* 🛒"
            ]);
        }

        // Cari produk paling cocok berdasarkan nama
        $products = Product::with(['variants', 'images'])->get();
        $bestProduct = null;
        $maxScore = 0;

        foreach ($products as $product) {
            $score = 0;
            $nameLower = strtolower($product->nama_produk);
            foreach ($keywords as $kw) {
                if (str_contains($nameLower, $kw)) {
                    $score += 10;
                }
            }
            if ($score > $maxScore) {
                $maxScore = $score;
                $bestProduct = $product;
            }
        }

        if (!$bestProduct || $maxScore < 5) {
            return response()->json([
                'reply' => "Maaf, saya tidak menemukan produk bernama **\"" . implode(' ', $keywords) . "\"** di toko kami. Coba sebutkan nama produk secara lebih lengkap dan jelas! 🔍"
            ]);
        }

        // Simpan produk terakhir ke Cache
        Cache::put($cacheKey, $bestProduct->id, 1800);

        return $this->executeAddToCartWithVariantCheck($bestProduct, $qty, $user, $message, $tabId);
    }

    /**
     * Mengecek dan mencocokkan varian produk dari input pengguna, memicu dialog interaktif jika belum terpilih.
     */
    private function executeAddToCartWithVariantCheck($bestProduct, $qty, $user, $message, $tabId = 'default')
    {
        $selectedVariant = null;
        $variants = $bestProduct->variants;

        if ($variants && $variants->count() > 0) {
            $cleanMsg = strtolower($message);
            foreach ($variants as $v) {
                $variantNameLower = strtolower($v->nama_jenis);
                
                // Menggunakan Boundary Regex matching untuk ukuran/varian berhuruf pendek agar tidak tabrakan di tengah kata
                if (in_array($variantNameLower, ['s', 'm', 'l', 'xl', 'xxl'])) {
                    if (preg_match('/\b' . $variantNameLower . '\b/i', $cleanMsg)) {
                        $selectedVariant = $v;
                        break;
                    }
                } else {
                    if (str_contains($cleanMsg, $variantNameLower)) {
                        $selectedVariant = $v;
                        break;
                    }
                }
            }

            // Jika ada varian di produk tetapi pengguna tidak menyebutkan varian yang valid atau cocok
            if (!$selectedVariant) {
                $formatRp = function($num) {
                    return 'Rp' . number_format($num, 0, ',', '.');
                };

                $reply = "⚙️ *Pilihan Varian Produk Diperlukan* ⚙️\n\n";
                $reply .= "![{$bestProduct->nama_produk}]({$bestProduct->primary_image})\n\n";
                $reply .= "Produk **\"{$bestProduct->nama_produk}\"** memiliki beberapa variasi menarik. Varian mana yang Anda inginkan?\n\n";
                
                foreach ($variants as $v) {
                    $status = $v->stok > 0 ? "🟢 Tersedia: **{$v->stok} unit**" : "🔴 Habis";
                    $reply .= "• **{$v->nama_jenis}** ({$formatRp($v->harga_jual)}) - {$status}\n";
                }
                
                $reply .= "\n💡 *Saran Cerdas:* Cukup balas dengan mengetik nama varian saja (contoh: **\"{$variants->first()->nama_jenis}\"** or **\"{$variants->last()->nama_jenis}\"**) untuk langsung memasukkannya ke keranjang! 🛒";
                
                // Perbarui ID produk ini di Cache memori agar reply varian selanjutnya bisa diproses
                Cache::put('last_interacted_product_id_' . $user->id . '_' . $tabId, $bestProduct->id, 1800);
                
                return response()->json(['reply' => $reply]);
            }
        }

        return $this->executeAddToCartDirectly($bestProduct, $qty, $user, $selectedVariant, $tabId);
    }

    /**
     * Melakukan mutasi penambahan ke keranjang belanja nyata di database secara langsung dengan varian spesifik.
     */
    private function executeAddToCartDirectly($bestProduct, $qty, $user, $selectedVariant = null, $tabId = 'default')
    {
        return DB::transaction(function() use ($bestProduct, $qty, $user, $selectedVariant, $tabId) {
            // Jika tidak terpilih varian tetapi produk memiliki varian, default ke varian pertama (fail-safe)
            if (!$selectedVariant && $bestProduct->variants && $bestProduct->variants->count() > 0) {
                $selectedVariant = $bestProduct->variants->first();
            }

            // Muat ulang stok dari DB dengan lockForUpdate untuk mencegah race conditions!
            if ($selectedVariant) {
                $vLocked = ProductVariant::lockForUpdate()->find($selectedVariant->id);
                $maxStok = $vLocked ? $vLocked->stok : 0;
                $price = $vLocked ? $vLocked->harga_jual : $selectedVariant->harga_jual;
                $variantId = $selectedVariant->id;
            } else {
                $pLocked = Product::lockForUpdate()->find($bestProduct->id);
                $maxStok = $pLocked ? $pLocked->stok : 0;
                $price = $pLocked ? $pLocked->harga_jual : $bestProduct->harga_jual;
                $variantId = null;
            }

            // Cek stok produk
            if ($maxStok < $qty) {
                $nameStr = $selectedVariant ? "{$bestProduct->nama_produk} (Varian: {$selectedVariant->nama_jenis})" : $bestProduct->nama_produk;
                return response()->json([
                    'reply' => "Maaf, stok untuk produk **{$nameStr}** tidak mencukupi. Stok tersedia: **{$maxStok} unit**, sedangkan Anda meminta **{$qty} unit**."
                ]);
            }

            // Tambah/Update item ke Cart di database
            $cart = Cart::where('user_id', $user->id)
                ->where('product_id', $bestProduct->id)
                ->where('variant_id', $variantId)
                ->first();

            if ($cart) {
                $newQuantity = $cart->qty + $qty;
                if ($newQuantity > $maxStok) {
                    return response()->json([
                        'reply' => "Gagal menambahkan! Produk **{$bestProduct->nama_produk}** sudah ada di keranjang Anda, dan tambahan **{$qty} unit** akan melampaui sisa stok yang tersedia."
                    ]);
                }
                $cart->qty = $newQuantity;
                $cart->save();
            } else {
                Cart::create([
                    'user_id' => $user->id,
                    'product_id' => $bestProduct->id,
                    'variant_id' => $variantId,
                    'qty' => $qty
                ]);
            }

            $totalPriceFmt = number_format($price * $qty, 0, ',', '.');
            
            $reply = "🚀 *Sukses Ditambahkan ke Keranjang Belanja!* 🚀\n\n";
            $reply .= "![{$bestProduct->nama_produk}]({$bestProduct->primary_image})\n\n";
            $reply .= "Saya telah memasukkan **{$qty} unit** produk istimewa **\"{$bestProduct->nama_produk}\"**";
            if ($selectedVariant) {
                $reply .= " (Varian: *{$selectedVariant->nama_jenis}*)";
            }
            $reply .= " ke keranjang belanja aktif Anda! 🛒\n\n";
            $reply .= "• Total Transaksi Item: **IDR {$totalPriceFmt}**\n\n";
            $reply .= "💡 *Langkah Selanjutnya:* Silakan ketik *'hitung total'* untuk meninjau rincian biaya keranjang belanja terupdate Anda, atau langsung ketik *'checkout'* di halaman keranjang belanja untuk menyelesaikan pesanan! 🛍️✨";

            // Hapus cache produk terinteraksi setelah berhasil ditambahkan agar tidak terjadi double-trigger yang tidak sengaja
            $cacheKey = 'last_interacted_product_id_' . $user->id . '_' . $tabId;
            Cache::forget($cacheKey);

            return response()->json([
                'reply' => $reply,
                'cart_added' => true
            ]);
        });
    }

    /**
     * FITUR KERANJANG CERDAS: Mengeluarkan/Menghapus item dari keranjang melalui chat.
     */
    private function handleRemoveFromCart($message, $user)
    {
        $cleanQuery = $this->cleanText($message);
        
        $stopWords = [
            'hapus', 'buang', 'keluarkan', 'hilangkan', 'delete', 'remove', 'dari', 'keranjang', 
            'belanja', 'saya', 'dong', 'tolong', 'barang', 'produk', 'item', 'kurangi', 'kurangkan'
        ];
        
        $keywords = array_filter(explode(' ', $cleanQuery), function($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        if (empty($keywords)) {
            return response()->json([
                'reply' => "Produk mana di keranjang yang ingin Anda hapus? Contoh: *'hapus baju batik dari keranjang'* 🛒"
            ]);
        }

        // Ambil isi keranjang user
        $cartItems = Cart::with('product')->where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda saat ini masih kosong melompong, jadi tidak ada barang yang bisa dihapus! 🛒"
            ]);
        }

        $itemToDelete = null;
        $maxScore = 0;

        foreach ($cartItems as $item) {
            $score = 0;
            $nameLower = strtolower($item->product->nama_produk);
            foreach ($keywords as $kw) {
                if (str_contains($nameLower, $kw)) {
                    $score += 10;
                }
            }
            if ($score > $maxScore) {
                $maxScore = $score;
                $itemToDelete = $item;
            }
        }

        if (!$itemToDelete || $maxScore < 5) {
            return response()->json([
                'reply' => "Saya tidak menemukan produk dengan kata kunci **\"" . implode(' ', $keywords) . "\"** di dalam keranjang belanja Anda. Coba ketik *'hitung total'* untuk melihat isi keranjang aktif Anda! 🔍"
            ]);
        }

        $productName = $itemToDelete->product->nama_produk;
        $primaryImage = $itemToDelete->product->primary_image;
        $itemToDelete->delete();

        $reply = "🗑️ *Produk Berhasil Dihapus dari Keranjang!* 🗑️\n\n";
        $reply .= "![{$productName}]({$primaryImage})\n\n";
        $reply .= "Saya telah mengeluarkan produk **\"{$productName}\"** dari keranjang belanja aktif Anda sesuai permintaan. \n\n";
        $reply .= "💡 *Saran Cerdas:* Ketik *'hitung total'* untuk melihat sisa tagihan belanjaan Anda saat ini! 🛍️";

        return response()->json([
            'reply' => $reply,
            'cart_updated' => true
        ]);
    }

    /**
     * FITUR KERANJANG CERDAS: Memperbarui kuantitas (qty) item keranjang melalui chat.
     */
    private function handleUpdateCartQuantity($message, $user)
    {
        // Cari angka target kuantitas (menjadi X)
        $qty = 1;
        if (preg_match('/(\d+)/', $message, $matches)) {
            $qty = intval($matches[1]);
        } else {
            return response()->json([
                'reply' => "Berapa kuantitas baru yang Anda inginkan? Contoh: *'ubah jumlah baju batik menjadi 3'* 🛒"
            ]);
        }

        if ($qty <= 0) {
            return response()->json([
                'reply' => "Kuantitas belanja harus bernilai minimal 1 unit. Jika ingin membuang barang, silakan ketik *'hapus [nama barang]'*. 😊"
            ]);
        }

        $cleanQuery = $this->cleanText($message);
        
        $stopWords = [
            'ubah', 'ganti', 'edit', 'set', 'menjadi', 'update', 'kuantitas', 'jumlah', 
            'quantity', 'qty', 'dari', 'keranjang', 'belanja', 'saya', 'dong', 'tolong', 
            'barang', 'produk', 'item', 'unit', 'pcs', strval($qty)
        ];
        
        $keywords = array_filter(explode(' ', $cleanQuery), function($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        if (empty($keywords)) {
            return response()->json([
                'reply' => "Produk mana di keranjang yang ingin Anda ubah kuantitasnya? Contoh: *'ganti jumlah baju batik menjadi 2'* 🛒"
            ]);
        }

        // Ambil isi keranjang user
        $cartItems = Cart::with(['product', 'variant'])->where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda saat ini masih kosong, tidak ada produk yang dapat diubah kuantitasnya! 🛒"
            ]);
        }

        $itemToUpdate = null;
        $maxScore = 0;

        foreach ($cartItems as $item) {
            $score = 0;
            $nameLower = strtolower($item->product->nama_produk);
            foreach ($keywords as $kw) {
                if (str_contains($nameLower, $kw)) {
                    $score += 10;
                }
            }
            if ($score > $maxScore) {
                $maxScore = $score;
                $itemToUpdate = $item;
            }
        }

        if (!$itemToUpdate || $maxScore < 5) {
            return response()->json([
                'reply' => "Saya tidak menemukan produk dengan kata kunci **\"" . implode(' ', $keywords) . "\"** di dalam keranjang belanja Anda. Coba pastikan ejaan nama produk sudah benar! 🔍"
            ]);
        }

        // Cek sisa stok produk/varian
        $maxStok = $itemToUpdate->variant ? $itemToUpdate->variant->stok : $itemToUpdate->product->stok;
        if ($qty > $maxStok) {
            return response()->json([
                'reply' => "Maaf, stok tidak mencukupi. Sisa stok tersedia untuk produk **{$itemToUpdate->product->nama_produk}** adalah **{$maxStok} unit**, sedangkan Anda meminta **{$qty} unit**."
            ]);
        }

        $itemToUpdate->qty = $qty;
        $itemToUpdate->save();

        $productName = $itemToUpdate->product->nama_produk;
        $primaryImage = $itemToUpdate->product->primary_image;
        $variantName = $itemToUpdate->variant ? " (Varian: *{$itemToUpdate->variant->nama_jenis}*)" : "";

        $reply = "⚙️ *Kuantitas Keranjang Berhasil Diperbarui!* ⚙️\n\n";
        $reply .= "![{$productName}]({$primaryImage})\n\n";
        $reply .= "Saya telah memperbarui kuantitas produk **\"{$productName}\"**{$variantName} di keranjang belanja Anda menjadi **{$qty} unit**! \n\n";
        $reply .= "💡 *Saran Cerdas:* Ketik *'hitung total'* untuk melihat kalkulasi subtotal tagihan terupdate Anda! 🛍️";

        return response()->json([
            'reply' => $reply,
            'cart_updated' => true
        ]);
    }

    /**
     * FITUR KERANJANG CERDAS: Mengosongkan keranjang belanja secara total melalui chat.
     */
    private function handleClearCart($user)
    {
        $cartItems = Cart::where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda saat ini memang sudah kosong bersih! 😊"
            ]);
        }

        Cart::where('user_id', $user->id)->delete();

        return response()->json([
            'reply' => "🧹 *Keranjang Belanja Berhasil Dikosongkan!* 🧹\n\nSeluruh produk yang ada di dalam keranjang belanja Anda telah berhasil dibersihkan secara total. \n\nMari mulai berbelanja produk-produk baru yang berkualitas di Radencak Shop! 🛒✨",
            'cart_updated' => true
        ]);
    }

    /**
     * FITUR: Menyajikan Invoice Ringkasan Belanja dan Link Checkout Cepat Resmi.
     */
    private function handleDirectCheckout($user)
    {
        $cartItems = Cart::with(['product', 'variant'])->where('user_id', $user->id)->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'reply' => "Keranjang belanja Anda saat ini masih kosong melompong. Yuk, mari kita cari beberapa produk impian Anda terlebih dahulu sebelum pergi ke kasir pembayaran! 🛒✨"
            ]);
        }

        $reply = "💳 *Invoice Digital & Ringkasan Checkout Belanja* 💳\n\n";
        $reply .= "Terima kasih telah mempercayakan transaksi belanja Anda di Radencak Shop. Berikut adalah invoice belanjaan siap checkout Anda:\n\n";
        
        $subtotal = 0;
        $totalItems = 0;

        foreach ($cartItems as $item) {
            $price = $item->variant ? $item->variant->harga_jual : $item->product->harga_jual;
            $itemTotal = $price * $item->qty;
            $subtotal += $itemTotal;
            $totalItems += $item->qty;
            
            $variantName = $item->variant ? " (Varian: *{$item->variant->nama_jenis}*)" : "";
            $priceFmt = number_format($price, 0, ',', '.');
            $totalFmt = number_format($itemTotal, 0, ',', '.');
            
            $reply .= "🛒 **{$item->product->nama_produk}**{$variantName}\n";
            $reply .= "  • {$item->qty} unit x IDR {$priceFmt} = **IDR {$totalFmt}**\n";
        }

        $subtotalFmt = number_format($subtotal, 0, ',', '.');
        $reply .= "\n📈 **Ringkasan Tagihan Akhir:**\n";
        $reply .= "• Total Barang: **{$totalItems} unit**\n";
        $reply .= "• **Subtotal Belanja: IDR {$subtotalFmt}**\n\n";
        $reply .= "🔥 **Corong Pembayaran Kilat Resmi:**\n";
        $reply .= "👉 **[KLIK DI SINI UNTUK MENYELESAIKAN PEMBAYARAN](/checkout)** 💳\n\n";
        $reply .= "🛡️ *Jaminan Keamanan:* Transaksi Anda diproses secara 100% aman terverifikasi oleh enkripsi SSL Radencak Pay.";

        return response()->json([
            'reply' => $reply
        ]);
    }

    /**
     * Fallback: Mengatasi kueri percakapan umum atau pencarian semantik universal.
     */
    private function handleGeneralQuery($message, $user, $activeProduct = null, $tabId = 'default')
    {
        $lowerMsg = strtolower($message);
        
        if ($this->hasKeywords($lowerMsg, ['halo', 'hai', 'siapa', 'selamat', 'pagi', 'siang', 'sore', 'malam'])) {
            $welcome = "🌟 *Selamat Datang di Raden AI - Asisten Belanja Pribadi Anda!* 🌟\n\n";
            $welcome .= "Saya adalah sistem kecerdasan logistik lokal yang siap memandu Anda berbelanja dengan cerdas, cepat, dan hemat. Saya terhubung langsung to database tanpa API eksternal.\n\n";
            
            if ($activeProduct) {
                $welcome .= "🛍️ **Konteks Produk Aktif:** Saya mendeteksi Anda sedang melihat **{$activeProduct->nama_produk}**.\n\n";
                $welcome .= "![{$activeProduct->nama_produk}]({$activeProduct->primary_image})\n\n";
                $welcome .= "Anda bisa langsung bertanya tentang harga, ulasan rating, merchant toko, atau deskripsinya kepada saya!\n\n";
            }
            
            $welcome .= "Berikut panduan layanan cerdas yang bisa saya lakukan:\n";
            $welcome .= "🔍 **Cari Produk Impian** (contoh: *'cari baju batik'*)\n";
            $welcome .= "🛒 **Tinjau Keranjang Belanja** (contoh: *'hitung total belanja'*)\n";
            $welcome .= "🎟️ **Analisis Voucher Terbesar** (contoh: *'rekomendasi voucher'*)\n";
            $welcome .= "📍 **Simulasi Ongkir Wilayah** (contoh: *'hitung ongkir ke daerah Anda'*)\n";
            $welcome .= "🚀 **Tambah Keranjang Instan** (contoh: *'masukkan sepatu ke keranjang'*)\n\n";
            $welcome .= "Ada yang bisa saya bantu asistenkan sekarang, Pelanggan Terhormat? 😊";
                
            return response()->json([
                'reply' => $welcome
            ]);
        }

        if ($this->hasKeywords($lowerMsg, ['terima kasih', 'makasih', 'thank', 'oke', 'ok'])) {
            return response()->json([
                'reply' => "Sangat senang dapat melayani Anda! 😊 Selalu menjadi kebahagiaan bagi saya untuk mempermudah pengalaman belanja Anda di Radencak Shop. Jika ada hal lain yang Anda butuhkan, saya selalu siap mendampingi perjalanan belanja cerdas Anda! 🛍️✨"
            ]);
        }

        return $this->handleProductSearch($message, $user, $tabId);
    }
}
