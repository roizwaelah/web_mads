import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Key, UserCircle, Trash2 } from 'lucide-react';
import { useModal } from "../../../context/ModalContext";
import { sanitizePlainText, validateStrongPassword, validateUsername } from "../../../utils/security";
import { safeJson } from "../../../utils/http";

const UserEditor = ({ showToast }) => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    password: '',
    role: 'Editor'
  });

  useEffect(() => {
    if (!isEdit) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users.php?id=${id}&ts=${Date.now()}`, { cache: "no-store" });
        const result = await safeJson(res);
        if (result.status === "success") {
          const payload = result.data ?? result;
          const selected = Array.isArray(payload)
            ? payload.find((u) => u.id?.toString() === id)
            : payload;
          if (!selected) {
            showToast?.("Pengguna tidak ditemukan.");
            navigate("/admin/users");
            return;
          }
          setFormData({
            fullname: selected.fullname || "",
            username: selected.username || "",
            password: "",
            role: selected.role || "Editor",
          });
        } else {
          showToast?.(result.message || "Gagal memuat data pengguna.");
        }
      } catch (error) {
        showToast?.("Gagal menyambung ke server");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, isEdit, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = isEdit ? { ...formData, id } : formData;
    payload.fullname = sanitizePlainText(payload.fullname);
    payload.username = sanitizePlainText(payload.username);

    if (!validateUsername(payload.username)) {
      showToast("Username hanya boleh huruf/angka/._@- (3-50 karakter).");
      return;
    }

    if (payload.password && !validateStrongPassword(payload.password)) {
      showToast("Password minimal 8 karakter, kombinasi huruf besar, kecil, dan angka.");
      return;
    }
    
    try {
      const res = await fetch("/api/users.php", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await safeJson(res);
      
      if (result.status === "success") {
        showToast(isEdit ? "Data diperbarui" : "Pengguna berhasil ditambah");
        window.dispatchEvent(new Event("users-updated"));
        navigate("/admin/users");
      } else {
        showToast(result.message || "Terjadi kesalahan");
      }
    } catch (error) {
      showToast("Gagal menyambung ke server");
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition">
        <ArrowLeft size={18} /> Kembali ke Daftar
      </button>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Profil Pengguna' : 'Tambah Pengguna Baru'}</h2>
          <p className="text-sm text-gray-500">Atur hak akses admin untuk mengelola website.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {loading && (
            <div className="text-sm text-gray-500">Memuat data pengguna...</div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input 
              type="text" required
              disabled={loading}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password {isEdit && <span className="text-xs text-blue-500 font-normal">(Kosongkan jika tidak ingin diubah)</span>}
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="password" required={!isEdit}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Hak Akses</label>
            <select 
              disabled={loading}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="Demo">Demo (Semua menu, perubahan lokal/session)</option>
              <option value="Read-Only">Read-Only (Semua menu, tanpa ubah data)</option>
              <option value="Editor">Editor (Hanya Konten)</option>
              <option value="Admin">Admin (Konten + Pengaturan)</option>
            </select>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
            {isEdit && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  openModal({
                    title: "Hapus Pengguna?",
                    content: `Apakah Anda yakin ingin menghapus pengguna ${formData.fullname || ""}?`,
                    confirmText: "Ya, Hapus",
                    cancelText: "Batal",
                    isDanger: true,
                    onConfirm: async () => {
                      try {
                        const res = await fetch(`/api/users.php?id=${id}`, { method: "DELETE" });
                        const result = await safeJson(res);
                        if (result.status === "success") {
                          showToast("Pengguna berhasil dihapus");
                          window.dispatchEvent(new Event("users-updated"));
                          navigate("/admin/users");
                        } else {
                          showToast(result.message || "Gagal menghapus pengguna");
                        }
                      } catch (error) {
                        showToast("Gagal menyambung ke server");
                      }
                    },
                  });
                }}
                className="bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-100 transition flex items-center gap-2"
              >
                <Trash2 size={16} /> Hapus
              </button>
            )}
            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Save size={18} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditor

