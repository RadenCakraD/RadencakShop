import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, onEdit, onDelete, hideActions = false }) {
    const primaryImg = product.primary_image;
    
    // Perbaikan Bug Harga: Membedakan logic harga dicoret.
    const hargaJual = parseFloat(product.harga_jual);
    const hargaDasar = parseFloat(product.harga_dasar || product.harga_jual);
    const rawDiskon = hargaDasar > hargaJual ? ((hargaDasar - hargaJual) / hargaDasar) * 100 : 0;
    const diskon = rawDiskon === 100 ? 100 : Math.floor(rawDiskon); // Hindari diskon 100% palsu akibat Math.round()
    
    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const isRaden = product.shop?.shop_tier === 'raden';

    return (
        <div className="bg-rc-card rounded-xl overflow-hidden border-[0.5px] border-rc-main/20 hover:border-rc-logo transition-colors duration-300 group flex flex-col relative text-rc-main">
            <Link to={`/product/${product.slug}`} className="block relative overflow-hidden flex-grow">
                <div className="aspect-[4/4] w-full overflow-hidden bg-rc-bg relative">
                    <img src={primaryImg} alt={product.nama_produk} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
                    
                    {/* Diskon Badge */}
                    {diskon > 0 && (
                        <div className="absolute top-2 right-2 bg-rc-logo text-rc-bg text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            {diskon}% OFF
                        </div>
                    )}
                </div>
                
                {!!product.is_flash_sale && (
                    <div className="absolute top-2 left-2 bg-red-600 border border-rc-main text-rc-main text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                        <i className="fa-solid fa-bolt text-rc-logo"></i> Flash Sale
                    </div>
                )}

                <div className="p-3">
                    {/* Toko Verification Badge */}
                    <div className="flex items-center gap-1 text-[10px] mb-1 font-semibold">
                        {isRaden ? (
                            <span className="bg-rc-logo text-rc-bg px-1.5 rounded flex items-center gap-1"><i className="fa-solid fa-crown"></i> Raden</span>
                        ) : (
                            <span className="bg-rc-muted/20 text-rc-muted px-1.5 rounded border-[0.5px] border-rc-main/30 flex items-center gap-1"><i className="fa-solid fa-store"></i> Rakyat</span>
                        )}
                        <span className="text-rc-muted truncate text-[10px]">{product.shop?.nama_toko || 'Toko'}</span>
                    </div>

                    <h3 className="text-sm font-bold text-rc-main line-clamp-2 min-h-[40px] leading-relaxed group-hover:text-rc-logo transition-colors duration-300">
                        {product.nama_produk}
                    </h3>

                    <div className="mt-2 flex flex-col">
                        {diskon > 0 ? (
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-rc-muted line-through opacity-60">{formatRp(hargaDasar)}</span>
                            </div>
                        ) : <div className="h-4"></div>}
                        <div className="text-lg font-bold text-rc-logo">{formatRp(hargaJual)}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-rc-muted">
                        <div className="flex items-center gap-1">
                            <i className="fa-solid fa-star text-rc-logo"></i>
                            <span>{product.reviews_avg_rating ? parseFloat(product.reviews_avg_rating).toFixed(1) : '0.0'}</span>
                            <span className="px-1">•</span>
                            <span>{product.order_items_sum_qty || 0} terjual</span>
                        </div>
                    </div>

                    {product.stok < 5 && product.stok > 0 && <div className="mt-2 flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-400/10 px-2 py-1 rounded border border-red-400/20 w-max"><i className="fa-solid fa-circle-exclamation"></i> Sisa {product.stok} buah</div>}
                </div>
            </Link>

            {!hideActions && (
                <div className="p-3 pt-0 mt-auto border-t-[0.5px] border-rc-main/20 flex gap-2">
                    <button onClick={onEdit} className="flex-1 bg-rc-bg border-[0.5px] border-rc-main/20 text-rc-main hover:border-rc-logo hover:text-rc-logo text-xs font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1 uppercase">
                        <i className="fa-solid fa-pen"></i> EDIT
                    </button>
                    <button onClick={onDelete} className="flex-1 bg-rc-bg border-[0.5px] border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1 uppercase">
                        <i className="fa-solid fa-trash"></i> HAPUS
                    </button>
                </div>
            )}
        </div>
    );
}
