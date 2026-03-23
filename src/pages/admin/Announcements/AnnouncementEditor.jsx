import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { Image as ImageIcon, X } from "lucide-react";
import MediaModal from "../../../components/ui/MediaModal";
import { safeJson } from "../../../utils/http";

const AnnouncementEditor = ({
  showToast,
  setAnnouncements,
  announcements,
  mediaItems,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingAnnouncement = id
    ? announcements?.find((a) => a.id?.toString() === id)
    : null;
  const [remoteAnnouncement, setRemoteAnnouncement] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (!id || editingAnnouncement) return;
    let active = true;
    const loadAnnouncement = async () => {
      try {
        const res = await fetch(`/api/announcements.php?id=${id}&ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          const payload = data.data ?? data;
          const found = Array.isArray(payload) ? payload[0] : payload;
          if (found) setRemoteAnnouncement(found);
        }
      } catch {
        // ignore
      }
    };
    loadAnnouncement();
    return () => {
      active = false;
    };
  }, [id, editingAnnouncement]);

  const activeAnnouncement = editingAnnouncement || remoteAnnouncement;

  useEffect(() => {
    if (activeAnnouncement) {
      setTitle(activeAnnouncement.title || "");
      setContent(activeAnnouncement.content || "");
      setAuthor(activeAnnouncement.author || "Admin");
    } else if (!id) {
      setTitle("");
      setContent("");
      setAuthor("Admin");
    }
  }, [activeAnnouncement, id]);

  const handleInsertMedia = (mediaItem) => {
    if (mediaItem.type === "image") {
      setContent(
        (prev) =>
          prev +
          `<br><img src="${mediaItem.url}" alt="${mediaItem.name}" style="max-width: 100%; height: auto;" /><br>`,
      );
    } else {
      setContent(
        (prev) =>
          prev +
          `<br><a href="${mediaItem.url}" target="_blank" style="color: #2271b1; text-decoration: underline;">Unduh Berkas Lampiran</a><br>`,
      );
    }
    showToast("Media disisipkan!");
  };

  const handleSave = async (statusTujuan) => {
    if (!title.trim() || !content.trim()) {
      showToast("Judul dan isi pengumuman wajib diisi!");
      return;
    }

    showToast("Menyimpan pengumuman...");

    const data = {
      id: editingAnnouncement ? editingAnnouncement.id : null,
      title,
      content,
      author,
      status: statusTujuan,
    };

    try {
      const response = await fetch("/api/announcements.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await safeJson(response).catch(() => ({}));

      if (result.status === "success") {
        showToast(result.message);
        const resList = await fetch(`/api/announcements.php?ts=${Date.now()}`, { cache: "no-store" });
        const dataList = await safeJson(resList).catch(() => ({}));
        if (dataList.status === "success") setAnnouncements?.(dataList.data);
        try {
          localStorage.setItem("announcements-updated-at", String(Date.now()));
        } catch {
          // ignore
        }
        window.dispatchEvent(new Event("announcements-updated"));
        navigate("/admin/announcements");
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
          {editingAnnouncement ? "Sunting Pengumuman" : "Buat Pengumuman Baru"}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            placeholder="Judul Pengumuman (Contoh: Libur Awal Ramadhan)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded text-xl focus:outline-none focus:border-blue-600 shadow-inner font-semibold bg-white"
          />

          <button
            onClick={() => setIsMediaModalOpen(true)}
            className="border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded shadow-sm hover:bg-white text-sm flex items-center gap-2 transition"
          >
            <ImageIcon className="w-4 h-4" /> Tambah Lampiran / Gambar
          </button>

          <div className="bg-white shadow-sm rounded border border-gray-300">
            <style>{`.quill-editor .ql-container { min-height: 250px; } .quill-editor .ql-toolbar { background-color: #f9fafb; border-top: none; border-left: none; border-right: none; }`}</style>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              className="quill-editor"
              placeholder="Tulis isi pengumuman selengkapnya di sini..."
            />
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
                  {activeAnnouncement ? activeAnnouncement.status : "Baru"}
                </span>
              </p>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleSave("Publish")}
                className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 shadow-sm transition"
              >
                {activeAnnouncement ? "Perbarui" : "Publish"}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Penulis
            </div>
            <div className="p-4">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems || []}
        onInsert={handleInsertMedia}
      />
    </div>
  );
};

export default AnnouncementEditor;

