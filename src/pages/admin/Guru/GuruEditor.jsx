import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { User, X } from "lucide-react";
import MediaModal from "../../../components/ui/MediaModal";
import { safeJson } from "../../../utils/http";

const GuruEditor = ({
  showToast,
  setGurus,
  gurus,
  mediaItems,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingGuru = id
    ? gurus?.find((g) => g.id?.toString() === id)
    : null;
  const [remoteGuru, setRemoteGuru] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [img, setImg] = useState("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (!id || editingGuru) return;
    let active = true;
    const loadGurus = async () => {
      try {
        const res = await fetch(`/api/gurus.php?ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          setGurus?.(data.data || []);
          const found = (data.data || []).find((g) => g.id?.toString() === id);
          if (found) setRemoteGuru(found);
        }
      } catch {
        // ignore
      }
    };
    loadGurus();
    return () => {
      active = false;
    };
  }, [id, editingGuru, setGurus]);

  const activeGuru = editingGuru || remoteGuru;

  useEffect(() => {
    if (activeGuru) {
      setName(activeGuru.name || "");
      setRole(activeGuru.role || "");
      setImg(activeGuru.img || "");
    } else if (!id) {
      setName("");
      setRole("");
      setImg("");
    }
  }, [activeGuru, id]);

  const handleMediaSelect = (media) => {
    if (media.type !== "image") {
      showToast("Harap pilih berkas gambar!");
      return;
    }
    setImg(media.url);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      showToast("Nama dan Jabatan wajib diisi!");
      return;
    }

    showToast("Menyimpan data...");
    const data = {
      id: editingGuru ? editingGuru.id : null,
      name,
      role,
      img,
    };

    try {
      const response = await fetch("/api/gurus.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await safeJson(response).catch(() => ({}));

      if (result.status === "success") {
        showToast(result.message);
        const resList = await fetch("/api/gurus.php");
        const dataList = await safeJson(resList).catch(() => ({}));
        if (dataList.status === "success") setGurus(dataList.data);
        navigate("/admin/gurus");
      } else {
        showToast(`Gagal: ${result.message}`);
      }
    } catch (error) {
      showToast("Koneksi ke server gagal.");
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/gurus")}
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          â† Kembali ke Daftar Guru
        </button>
        <h1 className="text-2xl font-normal text-gray-800">
          {editingGuru ? "Sunting Data Guru" : "Tambah Guru Baru"}
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white border border-gray-300 shadow-sm rounded-sm p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Foto Profil Area */}
          <div className="w-full sm:w-1/3 flex flex-col items-center gap-3">
            <div className="w-32 h-32 bg-gray-100 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {img ? (
                <img
                  src={img}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-300" />
              )}
            </div>
            <div className="flex flex-col gap-2 w-full text-center">
              <button
                type="button"
                onClick={() => setIsMediaModalOpen(true)}
                className="bg-white border border-gray-300 text-gray-700 py-1.5 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
              >
                Pilih Foto Profil
              </button>
              {img && (
                <button
                  type="button"
                  onClick={() => setImg("")}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Hapus Foto
                </button>
              )}
            </div>
          </div>

          {/* Form Area */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Achmad Darojat, S.Pd"
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-600 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tugas / Jabatan
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: Guru Matematika"
                className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:border-blue-600 bg-white"
                required
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 shadow-sm transition"
          >
            Simpan Data
          </button>
        </div>
      </form>

      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems || []}
        onInsert={handleMediaSelect}
      />
    </div>
  );
};

export default GuruEditor;

