import React from 'react';
import { Search, UserX, UserCheck, Trash2 } from 'lucide-react';

export default function AdminUsers({ 
    usersList, 
    searchUsers, 
    setSearchUsers, 
    handleUpdateUserStatus, 
    handleDeleteUser, 
    changeUserRole,
    pageUsers,
    totalPagesUsers,
    fetchUsers,
    currentUser
}) {
    const roles = Object.entries(usersList.reduce((acc, user) => {
        acc[user.role] = acc[user.role] || [];
        acc[user.role].push(user);
        return acc;
    }, {}));

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex bg-rc-card p-2 rounded-xl border border-rc-main/10 items-center">
                <Search className="mx-3 text-rc-muted w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cari username, nama atau email..."
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                    className="bg-transparent outline-none text-sm font-medium flex-1 text-rc-main"
                />
            </div>

            {roles.map(([role, users]) => (
                <div key={role} className="mb-8">
                    <h3 className="text-[10px] font-black uppercase text-rc-muted tracking-widest mb-3 border-b border-white/5 pb-2">Kategori: {role.replace('_', ' ')}</h3>
                    <div className="overflow-x-auto border border-rc-main/10 rounded-xl">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-rc-card border-b border-rc-main/10 text-[10px] uppercase text-rc-muted tracking-widest">
                                <tr>
                                    <th className="p-4 w-[25%]">Pengguna</th>
                                    <th className="p-4 w-[25%]">Email</th>
                                    <th className="p-4 w-[15%]">Role Saat Ini</th>
                                    <th className="p-4 w-[15%]">Ubah Role</th>
                                    <th className="p-4 w-[20%] text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs text-rc-main">
                                {users.map((u, i) => (
                                    <tr key={u.id} className={i % 2 === 0 ? 'bg-rc-bg' : 'bg-rc-card/30'}>
                                        <td className="p-4 font-bold">{u.username} <br /><span className="text-[9px] font-normal text-rc-muted">{u.name}</span></td>
                                        <td className="p-4">{u.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase ${
                                                u.role === 'super_admin' ? 'bg-red-500/20 text-red-400' : 
                                                u.role === 'admin_staff' ? 'bg-blue-500/20 text-blue-400' : 
                                                ['admin_logistik', 'sortir_logistik', 'logistik_internal', 'logistik_external'].includes(u.role) ? 'bg-orange-500/20 text-orange-400' :
                                                ['admin_kurir', 'sortir_kurir', 'kurir', 'kurir_staff'].includes(u.role) ? 'bg-teal-500/20 text-teal-400' :
                                                'bg-rc-main/10 text-rc-muted'
                                            }`}>{u.role.replace('_', ' ')}</span>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => changeUserRole(u.id, e.target.value)}
                                                className="bg-rc-card text-xs font-bold text-rc-main p-1 rounded outline-none border border-rc-main/20 w-full"
                                                disabled={currentUser?.role !== 'super_admin'}
                                            >
                                                <option value="user">USER / TOKO</option>
                                                <option value="kurir_staff">KURIR LAPANGAN</option>
                                                <option value="sortir_kurir">SORTIR KURIR</option>
                                                <option value="admin_kurir">ADMIN KURIR</option>
                                                <option value="logistik_internal">LOGISTIK INTERNAL</option>
                                                <option value="logistik_external">LOGISTIK EKSTERNAL</option>
                                                <option value="sortir_logistik">SORTIR LOGISTIK</option>
                                                <option value="admin_logistik">ADMIN LOGISTIK</option>
                                                <option value="admin_staff">ADMIN STAFF</option>
                                                <option value="super_admin">SUPER ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                {u.role !== 'super_admin' ? (
                                                    <>
                                                        {u.status !== 'suspended' ? (
                                                            <button onClick={() => handleUpdateUserStatus(u.id, 'suspended')} className="text-rc-muted hover:text-red-500 transition-colors" title="Blokir Akun">
                                                                <UserX className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleUpdateUserStatus(u.id, 'active')} className="text-red-500 hover:text-green-500 transition-colors" title="Buka Blokir">
                                                                <UserCheck className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteUser(u.id)} className="text-rc-muted hover:text-red-500 transition-colors" title="Hapus Permanen">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-black text-rc-muted uppercase opacity-30">Protected</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-8">
                <button disabled={pageUsers <= 1} onClick={() => fetchUsers(pageUsers - 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Sebelumnya</button>
                <span className="text-rc-muted text-xs font-bold uppercase tracking-widest">Halaman {pageUsers} dari {totalPagesUsers}</span>
                <button disabled={pageUsers >= totalPagesUsers} onClick={() => fetchUsers(pageUsers + 1)} className="px-6 py-2 bg-rc-card text-rc-main text-xs font-black uppercase tracking-widest rounded-xl border border-rc-main/10 disabled:opacity-50 hover:bg-rc-logo hover:text-rc-bg transition-all">Berikutnya</button>
            </div>
        </div>
    );
}
