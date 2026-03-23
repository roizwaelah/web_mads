import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { Database, Plus } from "lucide-react";

const ModuleList = ({ modules = [], setModules = () => {}, showToast }) => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [search, setSearch] = useState("");

  const filteredModules = useMemo(() => {
    if (!search) return modules;
    const q = search.toLowerCase();
    return modules.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.slug?.toLowerCase().includes(q),
    );
  }, [modules, search]);

  const handleDelete = (id) => {
    openModal({
      title: "Hapus Module?",
      content: "Semua data yang terkait akan ikut terhapus.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/modules.php?id=${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.status === "success") {
            setModules(modules.filter((m) => m.id !== id));
            showToast?.("Module berhasil dihapus.");
          } else {
            showToast?.(data.message || "Gagal menghapus module.");
          }
        } catch {
          showToast?.("Koneksi server gagal.");
        }
      },
    });
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <Database className="w-5 h-5 text-[#2271b1]" />
          Menu Khusus
        </h1>
      </div>
      <p className="text-[13px] text-gray-600 mb-4 max-w-3xl">
        Buat module data custom, misalnya daftar peserta lomba,
        alumni, inventaris, atau penerima bantuan. Data diinput lewat panel
        admin dan bisa ditampilkan di halaman publik melalui blok Data Module
        atau dipasang pada Laman.
      </p>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Cari module..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm w-full md:w-64"
        />
        <button
          onClick={() => navigate("/admin/modules/edit")}
          className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
        >
          <Plus className="w-4 h-4" /> Tambah Module
        </button>
      </div>

      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-x-auto text-[13px]">
        <table className="w-full text-left">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              <th className="p-3 font-semibold">Nama Module</th>
              <th className="p-3 font-semibold w-64">Slug</th>
              <th className="p-3 font-semibold w-40">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredModules.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  Belum ada module.
                </td>
              </tr>
            ) : (
              filteredModules.map((module) => (
                <tr key={module.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-[#2271b1]">
                    {module.title}
                  </td>
                  <td className="p-3 text-gray-600">{module.slug}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-[12px]">
                      <button
                        onClick={() => navigate(`/admin/modules/${module.id}`)}
                        className="text-[#2271b1] font-bold hover:underline"
                      >
                        Kelola
                      </button>
                      |
                      <button
                        onClick={() => navigate(`/admin/modules/edit/${module.id}`)}
                        className="text-green-600 font-bold hover:underline ml-1"
                      >
                        Edit
                      </button>
                      |
                      <button
                        onClick={() => handleDelete(module.id)}
                        className="text-red-500 font-bold hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModuleList;

