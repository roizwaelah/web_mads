import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, X } from "lucide-react";
import MediaModal from "../../../components/ui/MediaModal";
import { safeJson } from "../../../utils/http";

const EkskulEditor = ({
  showToast,
  setEkskul,
  ekskul,
  mediaItems,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingEkskul = id ? ekskul.find((item) => item.id.toString() === id) : null;
  const [remoteEkskul, setRemoteEkskul] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [coach, setCoach] = useState("");
  const [schedule, setSchedule] = useState("");
  const [category, setCategory] = useState("");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const categoryOptions = [
    "Olahraga",
    "Seni",
    "Keagamaan",
    "Akademik",
    "Teknologi",
    "Kepemimpinan",
    "Lainnya",
  ];

  useEffect(() => {
    if (!id || editingEkskul) return;
    let active = true;
    const loadEkskul = async () => {
      try {
        const res = await fetch(`/api/ekskul.php?ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          setEkskul?.(data.data || []);
          const found = (data.data || []).find((e) => e.id?.toString() === id);
          if (found) setRemoteEkskul(found);
        }
      } catch {
        // ignore
      }
    };
    loadEkskul();
    return () => {
      active = false;
    };
  }, [id, editingEkskul, setEkskul]);

  const activeEkskul = editingEkskul || remoteEkskul;

  useEffect(() => {
    if (activeEkskul) {
      setName(activeEkskul.name || "");
      setDescription(activeEkskul.description || "");
      setImage(activeEkskul.image || activeEkskul.img || "");
      setCoach(activeEkskul.coach || "");
      setSchedule(activeEkskul.schedule || "");
      setCategory(activeEkskul.category || "");
    } else if (!id) {
      setName("");
      setDescription("");
      setImage("");
      setCoach("");
      setSchedule("");
      setCategory("");
    }
  }, [activeEkskul, id]);

  const handleMediaSelect = (media) => {
    if (media.type !== "image") {
      showToast("Harap pilih berkas gambar!");
      return;
    }
    setImage(media.url);
  };

  const handleSave = async (statusTujuan) => {
    if (!name.trim()) {
      showToast("Nama ekskul wajib diisi!");
      return;
    }
    if (!category.trim()) {
      showToast("Kategori ekskul wajib dipilih!");
      return;
    }
    const scheduleValue = schedule.trim();
    if (scheduleValue) {
      const schedulePattern = /^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\s+\d{1,2}([.:]\d{2})?\s*[-â€“]\s*\d{1,2}([.:]\d{2})?$/i;
      if (!schedulePattern.test(scheduleValue)) {
        showToast("Format jadwal tidak valid. Contoh: Jumat 15.00 - 17.00");
        return;
      }
    }

    showToast("Menyimpan ekskul...");
    const data = {
      id: editingEkskul ? editingEkskul.id : null,
      name,
      description,
      image,
      coach,
      schedule,
      category,
      status: statusTujuan,
    };

    try {
      const response = await fetch("/api/ekskul.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await safeJson(response).catch(() => ({}));

      if (result.status === "success") {
        showToast(result.message);
        const resList = await fetch("/api/ekskul.php");
        const dataList = await safeJson(resList).catch(() => ({}));
        if (dataList.status === "success") setEkskul(dataList.data);
        navigate("/admin/ekskul");
      } else {
        showToast(`Gagal: ${result.message}`);
      }
    } catch (error) {
      showToast("Koneksi ke server gagal.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-800">
          {editingEkskul ? "Sunting Ekskul" : "Tambah Ekskul Baru"}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            placeholder="Nama Ekstrakurikuler (Contoh: Pramuka, Futsal...)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded text-xl focus:outline-none focus:border-blue-600 shadow-inner font-semibold bg-white"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Singkat
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="5"
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-600 bg-white"
              placeholder="Jelaskan sedikit tentang kegiatan ekskul ini..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Pembina
              </label>
              <input
                type="text"
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-600 bg-white"
                placeholder="Contoh: Ust. Ahmad"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Jadwal Kegiatan
              </label>
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-600 bg-white"
                placeholder="Contoh: Jumat 15.00 - 17.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-600 bg-white"
              required
            >
              <option value="">-- Pilih Kategori --</option>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6 text-sm">
          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Terbitkan
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <button
                  onClick={() => handleSave("Draft")}
                  className="border border-blue-600 text-blue-600 bg-gray-50 px-3 py-1 rounded shadow-sm hover:bg-blue-50 transition"
                >
                  Simpan Draft
                </button>
              </div>
              <p className="text-gray-500">
                Status:{" "}
                <span className="font-bold text-gray-800">
                  {activeEkskul ? activeEkskul.status : "Baru"}
                </span>
              </p>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleSave("Publish")}
                className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 shadow-sm transition"
              >
                {activeEkskul ? "Perbarui" : "Publish"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Gambar Banner
            </div>
            <div className="p-4">
              <div className="w-full h-40 bg-gray-100 rounded border border-gray-200 mb-3 flex items-center justify-center overflow-hidden relative group">
                {image ? (
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsMediaModalOpen(true)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-1.5 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
                >
                  Pilih Gambar
                </button>
                {image && (
                  <button
                    onClick={() => setImage("")}
                    className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems || []}
        onInsert={handleMediaSelect}
      />
    </div>
  );
};

export default EkskulEditor;
