import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Edit3, Image as ImageIcon, Building } from 'lucide-react';
import MediaModal from '../../components/ui/MediaModal';
import { useModal } from "../../context/ModalContext";
import { safeJson } from "../../utils/http";

const Facilities = ({ showToast, mediaItems }) => {
  const { openModal } = useModal();
  const [facilities, setFacilities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const selectAllRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });

  const fetchFacilities = async () => {
    const res = await fetch(`/api/facilities.php?ts=${Date.now()}`, { cache: "no-store" });
    const result = await safeJson(res).catch(() => ({}));
    if (result.status === "success") setFacilities(result.data);
  };

  useEffect(() => { fetchFacilities(); }, []);

  const filteredFacilities = useMemo(() => {
    if (!search) return facilities;
    const q = search.toLowerCase();
    return facilities.filter((f) =>
      f.name?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q)
    );
  }, [facilities, search]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredFacilities.length;
    }
  }, [selectedIds, filteredFacilities]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = filteredFacilities.map((f) => f.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      showToast("Pilih aksi terlebih dahulu.");
      return;
    }
    if (selectedIds.length === 0) {
      showToast("Pilih minimal satu fasilitas.");
      return;
    }
    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Fasilitas Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} fasilitas?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/facilities.php?id=${id}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );
            setFacilities(facilities.filter((f) => !selectedIds.includes(f.id)));
            setSelectedIds([]);
            setBulkAction("");
            showToast("Fasilitas berhasil dihapus.");
          } catch {
            showToast("Koneksi server gagal.");
          }
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...formData, id: editingId } : formData;

    const res = await fetch("/api/facilities.php", {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await safeJson(res).catch(() => ({}));
    if (result.status === "success") {
      showToast(editingId ? "Fasilitas diperbarui" : "Fasilitas ditambah");
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', description: '', image: '' });
      fetchFacilities();
    }
  };

  const handleDelete = (item) => {
    openModal({
      title: "Hapus Fasilitas?",
      content: `Apakah Anda yakin ingin menghapus ${item.name}?`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/facilities.php?id=${item.id}`, { method: "DELETE" });
          const result = await safeJson(res).catch(() => ({}));
          if (result.status === "success") {
            setFacilities(facilities.filter((f) => f.id !== item.id));
            showToast("Fasilitas berhasil dihapus.");
          } else {
            showToast(result.message || "Gagal menghapus fasilitas.");
          }
        } catch {
          showToast("Koneksi server gagal.");
        }
      },
    });
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <Building className="w-6 h-6 text-[#2271b1]" />
          Manajemen Fasilitas
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
          <input
            type="text"
            placeholder="Cari fasilitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <button 
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <Plus className="w-4 h-4" />Tambah Baru
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
                    filteredFacilities.length > 0 &&
                    selectedIds.length === filteredFacilities.length
                  }
                />
              </th>
              <th className="p-3 font-semibold w-24">Gambar</th>
              <th className="p-3 font-semibold">Nama</th>
              <th className="p-3 font-semibold">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFacilities.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  Belum ada fasilitas.
                </td>
              </tr>
            ) : (
              filteredFacilities.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectOne(item.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden border border-gray-200">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon size={18} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => { setEditingId(item.id); setFormData(item); setIsModalOpen(true); }}
                      className="font-semibold text-[#2271b1] text-[14px] hover:underline text-left"
                    >
                      {item.name}
                    </button>
                    <div className="text-[13px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(item.id); setFormData(item); setIsModalOpen(true); }}
                        className="text-[#2271b1] hover:underline"
                      >
                        Sunting
                      </button>{" "}
                      |
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-500 hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600 line-clamp-2">{item.description}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Input Fasilitas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-bold">{editingId ? 'Edit Fasilitas' : 'Tambah Fasilitas'}</div>
            <div className="p-6 space-y-4">
              <input 
                type="text" placeholder="Nama Fasilitas" required
                className="w-full border rounded-lg p-3"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              />
              <textarea 
                placeholder="Deskripsi singkat..." rows="3"
                className="w-full border rounded-lg p-3"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden border">
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={20}/></div>}
                </div>
                <button type="button" onClick={() => setIsMediaModalOpen(true)} className="text-sm bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">Pilih Gambar</button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Batal</button>
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <MediaModal 
        isOpen={isMediaModalOpen} 
        onClose={() => setIsMediaModalOpen(false)} 
        mediaItems={mediaItems} 
        onInsert={(media) => { setFormData({ ...formData, image: media.url }); }} 
      />
    </div>
  );
};

export default Facilities;

