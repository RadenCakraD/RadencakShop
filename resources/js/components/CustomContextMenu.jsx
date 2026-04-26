import React, { useState, useEffect, useCallback } from 'react';

export default function CustomContextMenu() {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleContextMenu = useCallback((e) => {
        // Jangan tampilkan jika sedang di input atau textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        e.preventDefault();
        setVisible(true);
        setPosition({ x: e.pageX, y: e.pageY });
    }, []);

    const handleClick = useCallback(() => {
        setVisible(false);
    }, []);

    useEffect(() => {
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('click', handleClick);
        };
    }, [handleContextMenu, handleClick]);

    if (!visible) return null;

    const menuItems = [
        { 
            label: 'Buka di Tab Baru', 
            icon: 'fa-external-link', 
            action: () => window.open(window.location.href, '_blank') 
        },
        { 
            label: 'Buka di Jendela Baru', 
            icon: 'fa-window-maximize', 
            action: () => window.open(window.location.href, '_blank', 'width=1200,height=800') 
        },
        { 
            label: 'Segarkan Halaman', 
            icon: 'fa-rotate-right', 
            action: () => window.location.reload() 
        }
    ];

    // Mencegah menu keluar layar
    const style = {
        top: position.y,
        left: position.x,
        transform: (position.x + 200 > window.innerWidth) ? 'translateX(-100%)' : 'none'
    };

    return (
        <div 
            className="fixed z-[9999] bg-rc-bg/95 backdrop-blur-xl border-[0.5px] border-rc-main/20 rounded-xl shadow-2xl overflow-hidden py-2 min-w-[200px] animate-fade-in"
            style={style}
        >
            <div className="px-4 py-2 border-b border-rc-main/10 mb-1">
                <p className="text-[9px] font-black text-rc-logo uppercase tracking-[0.2em]">Radencak Portal</p>
            </div>
            {menuItems.map((item, idx) => (
                <button
                    key={idx}
                    onClick={item.action}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs text-rc-main hover:bg-rc-logo hover:text-rc-bg transition-all duration-200 group text-left"
                >
                    <i className={`fa-solid ${item.icon} opacity-50 group-hover:opacity-100 w-4 text-center`}></i>
                    <span className="font-bold uppercase tracking-wider text-[10px]">{item.label}</span>
                </button>
            ))}
        </div>
    );
}
