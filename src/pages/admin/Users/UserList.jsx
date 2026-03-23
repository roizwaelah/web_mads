import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Edit2, Trash2, ShieldCheck } from 'lucide-react';
import { useModal } from "../../../context/ModalContext";
import { getActivityLogs } from "../../../utils/auth";
import { EDITOR_MENU_LIST } from "../../../utils/rbac";
import { safeJson } from "../../../utils/http";

const UserList = ({ onEdit, showToast, currentUser, editorMenuAccess = {}, onEditorMenuAccessChange }) => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const selectAllRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users.php?ts=${Date.now()}`, { cache: "no-store" });
      const result = await safeJson(res);
      if (result.status === "success") setUsers(result.data);
    } catch (error) {
      showToast("Gagal mengambil data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const refresh = () => fetchUsers();
    window.addEventListener("users-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("users-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    setActivityLogs(getActivityLogs().slice(0, 8));
  }, []);

  const handleDelete = (user) => {
    openModal({
      title: "Hapus Pengguna?",
      content: `Apakah Anda yakin ingin menghapus ${user.fullname}?`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users.php?id=${user.id}&ts=${Date.now()}`, { method: "DELETE" });
          const result = await safeJson(res);
          if (result.status === "success") {
            showToast("Pengguna berhasil dihapus");
            fetchUsers();
          } else {
            showToast(result.message || "Gagal menghapus pengguna");
          }
        } catch (error) {
          showToast("Gagal menyambung ke server");
        }
      },
    });
  };

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter((u) =>
      u.fullname?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  }, [users, search]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredUsers.length;
    }
  }, [selectedIds, filteredUsers]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = filteredUsers.map((u) => u.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      showToast("Pilih aksi terlebih dahulu.");
      return;
    }
    if (selectedIds.length === 0) {
      showToast("Pilih minimal satu pengguna.");
      return;
    }
    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Pengguna Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} pengguna?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/users.php?id=${id}&ts=${Date.now()}`, {
                  method: "DELETE",
                }),
              ),
            );
            setUsers(users.filter((u) => !selectedIds.includes(u.id)));
            setSelectedIds([]);
            setBulkAction("");
            showToast("Pengguna berhasil dihapus");
          } catch {
            showToast("Gagal menghapus pengguna");
          }
        },
      });
    }
  };

  const handleToggleEditorMenuAccess = (menu) => {
    const next = {
      ...editorMenuAccess,
      [menu]: !Boolean(editorMenuAccess[menu]),
    };
    onEditorMenuAccessChange?.(next);
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          Manajemen Pengguna
        </h1>
      </div>

      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Bulk Action</option>
            <option value="delete">Hapus</option>
          </select>

          <button
            onClick={handleBulkAction}
            className="border border-gray-300 px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
          >
            Terapkan
          </button>

          {selectedIds.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {selectedIds.length} dipilih
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" placeholder="Cari nama atau username..." 
              className="border border-gray-300 rounded pl-9 pr-4 py-1 text-sm w-full"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => navigate("/admin/users/edit")}
            className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <UserPlus size={16} />Tambah
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-x-auto text-[13px]">
        <table className="w-full text-left">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              <th className="p-3 w-8">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    filteredUsers.length > 0 &&
                    selectedIds.length === filteredUsers.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Nama Lengkap</th>
              <th className="p-3 font-semibold">Username</th>
              <th className="p-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center text-gray-400 italic">Memuat data...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">Belum ada pengguna.</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => handleSelectOne(user.id)}
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                      className="font-semibold text-[#2271b1] text-[14px] hover:underline text-left"
                    >
                      {user.fullname}
                    </button>
                    <div className="text-[13px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/admin/users/edit/${user.id}`)}
                        className="text-[#2271b1] hover:underline"
                      >
                        Sunting
                      </button>{" "}
                      |
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-500 hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">@{user.username}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1 ${
                      user.role === 'Admin'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'Read-Only'
                          ? 'bg-amber-100 text-amber-700'
                          : user.role === 'Demo'
                            ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      <ShieldCheck size={12} /> {user.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-[#1d2327] mb-1">Checklist Menu Akses Role Editor</h2>
          <p className="text-xs text-gray-500 mb-3">
            Berikut menu yang bisa diakses Editor (checkbox aktif = diizinkan).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
            {EDITOR_MENU_LIST.map((menu) => (
              <label key={menu} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(editorMenuAccess[menu])}
                  onChange={() => handleToggleEditorMenuAccess(menu)}
                  className="accent-green-600"
                />
                <span>{menu}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
            Role aktif saat ini: <span className="font-semibold text-blue-700">{currentUser?.role || "-"}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-bold text-[#1d2327] mb-3">Aktivitas Terbaru</h2>
          {activityLogs.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada aktivitas tercatat.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activityLogs.map((log, idx) => (
                <li key={`${log.at}-${idx}`} className="border-b border-gray-100 pb-2">
                  <div className="font-semibold text-gray-700">{log.action}</div>
                  <div className="text-gray-500 text-xs">{log.detail || "-"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList

