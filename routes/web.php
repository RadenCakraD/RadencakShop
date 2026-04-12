<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'Dashboard_Shop')->name('dashboard');

Route::view('/login', 'Auth.Login')->name('login');

Route::view('/daftar', 'Auth.daftar')->name('daftar');

Route::view('/daftar-toko', 'Auth.daftarToko')->name('daftar.toko');

Route::view('/chat', 'Chat.Chat_shop')->name('chat');

Route::view('/informasi', 'Information.informasi')->name('informasi');

Route::view('/keranjang', 'Keranjang.keranjang')->name('keranjang');

Route::view('/profile', 'profile')->name('profile');

Route::view('/mytoko', 'MyToko.myToko')->name('mytoko');

Route::get('/product/{slug}', function ($slug) {
    return view('Product_shop', ['slug' => $slug]);
})->name('product');

Route::get('/toko/{id?}', function ($id = null) {
    return view('Toko_shop', ['id' => $id]);
})->name('toko');

Route::view('/pembayaran', 'Pembayaran')->name('pembayaran');
