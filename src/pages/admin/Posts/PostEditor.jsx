import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Image as ImageIcon, X } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import MediaModal from "../../../components/ui/MediaModal";
import { safeJson } from "../../../utils/http";

const PostEditor = ({ showToast, setPosts, posts, mediaItems }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const editingPost = id ? posts.find((p) => p.id.toString() === id) : null;
  const [remotePost, setRemotePost] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Berita Utama");
  const [author, setAuthor] = useState("Admin");
  const [image, setImage] = useState("");
  
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState("content"); // 'content' atau 'featured'

  const quillModules = {
    toolbar: [
      [{ font: [] }, { header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }, { direction: "rtl" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  useEffect(() => {
    if (!id || editingPost) return;
    let active = true;
    const loadPost = async () => {
      try {
        const res = await fetch(`/api/posts.php?id=${id}&ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          const payload = data.data ?? data;
          const found = Array.isArray(payload) ? payload[0] : payload;
          if (found) setRemotePost(found);
        }
      } catch {
        // ignore
      }
    };
    loadPost();
    return () => {
      active = false;
    };
  }, [id, editingPost]);

  const activePost = editingPost || remotePost;

  useEffect(() => {
    if (activePost && !title) {
      setTitle(activePost.title || "");
      setContent(activePost.content || "");
      setCategory(activePost.category || "Berita Utama");
      setAuthor(activePost.author || "Admin");
      setImage(activePost.image || activePost.img || "");
    } else if (!id) {
      setTitle("");
      setContent("");
      setCategory("Berita Utama");
      setAuthor("Admin");
      setImage("");
    }
  }, [activePost, id]);

  // FUNGSI UTAMA PENYISIPAN MEDIA
  const handleInsertMedia = (mediaItem) => {
    const API_BASE = "/api/";
    const rawUrl = mediaItem.url || mediaItem.path || mediaItem.file_path;
    
    if (!rawUrl) return;
    const finalUrl = rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;

    if (mediaTarget === "featured") {
      // UNTUK GAMBAR UNGGULAN
      console.log("Setting featured image:", finalUrl);
      setImage(finalUrl); 
      // Tidak perlu mengubah state 'content' di sini
    } else {
      // UNTUK TEXT EDITOR (QUILL)
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection() || { index: editor.getLength() };
        
        // Sisipkan gambar ke editor
        editor.insertEmbed(range.index, "image", finalUrl);
        
        // PENTING: Segera ambil HTML terbaru dari editor dan simpan ke state content
        // Ini mencegah konten hilang saat re-render berikutnya
        const newContent = editor.root.innerHTML;
        setContent(newContent);
        
        editor.setSelection(range.index + 1);
      }
    }
    setIsMediaModalOpen(false);
  };

  const handleSave = async (statusTujuan) => {
    if (!title.trim()) {
      showToast?.("Judul pos tidak boleh kosong!");
      return;
    }

    // Pastikan mengirim properti sesuai struktur database
    const postData = {
      id: editingPost ? editingPost.id : null,
      title: title,
      author: author,
      category: category,
      image: image, 
      img: image, // Cadangan jika API menggunakan key 'img'
      status: statusTujuan,
      content: content,
    };

    try {
      const response = await fetch("/api/posts.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      const result = await safeJson(response).catch(() => ({}));

      if (result.status === "success") {
        showToast?.(result.message);
        const resPosts = await fetch(`/api/posts.php?ts=${Date.now()}`, { cache: "no-store" });
        const dataPosts = await safeJson(resPosts).catch(() => ({}));
        if (dataPosts.status === "success") setPosts?.(dataPosts.data);
        try {
          localStorage.setItem("posts-updated-at", String(Date.now()));
        } catch {
          // ignore
        }
        window.dispatchEvent(new Event("posts-updated"));
        
        // Pindah halaman setelah BERHASIL save
        navigate("/admin/posts");
      } else {
        showToast?.(`Gagal: ${result.message}`);
      }
    } catch (error) {
      showToast?.("Koneksi ke server gagal.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-normal text-gray-800">
          {editingPost ? "Sunting Pos" : "Tambah Pos Baru"}
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            placeholder="Tambahkan judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded text-xl focus:outline-none focus:border-blue-600 shadow-inner text-gray-800 font-semibold bg-white"
          />

          <button
            onClick={() => {
              setMediaTarget("content"); // Target ke quill
              setIsMediaModalOpen(true);
            }}
            className="border border-gray-300 bg-gray-50 text-gray-600 px-3 py-1.5 rounded shadow-sm hover:bg-white text-sm flex items-center gap-2 transition"
          >
            <ImageIcon className="w-4 h-4" /> Tambah Media
          </button>

          <div className="bg-white shadow-sm rounded border border-gray-300">
            <style>{`
              .quill-editor .ql-container { min-height: 400px; font-size: 14px; font-family: inherit; }
              .quill-editor .ql-toolbar { border-top: none; border-left: none; border-right: none; background-color: #f9fafb; }
              .quill-editor .ql-container.ql-snow { border: none; }
              .quill-editor .ql-editor img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
            `}</style>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              className="quill-editor"
              placeholder="Mulai menulis konten berita Anda di sini..."
            />
          </div>
        </div>

        <div className="w-full lg:w-72 space-y-6 text-sm">
          {/* KOTAK TERBITKAN */}
          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Terbitkan
            </div>
            <div className="p-4 space-y-4">
              <button
                onClick={() => handleSave("Draft")}
                className="border border-blue-600 text-blue-600 bg-gray-50 px-3 py-1 rounded shadow-sm hover:bg-blue-50 transition"
              >
                Simpan Draft
              </button>
              <p className="text-gray-500">
                Status:{" "}
                <span className="font-bold text-gray-800">
                  {activePost ? activePost.status : "Baru"}
                </span>
              </p>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleSave("Publish")}
                className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 shadow-sm transition"
              >
                {activePost ? "Perbarui" : "Publish"}
              </button>
            </div>
          </div>

          {/* KOTAK GAMBAR UNGGULAN */}
          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Gambar Unggulan
            </div>
            <div className="p-4 flex flex-col items-center">
              {image ? (
                <div className="relative w-full group">
                  <img
                    src={image}
                    alt="Featured Preview"
                    className="w-full aspect-video object-cover rounded border border-gray-200"
                    key={image}
                    onError={(e) => {
                      console.error("Gagal memuat gambar:", image);
                      e.target.src = "https://placehold.co/800x600";
                    }}
                  />
                  <button
                    onClick={() => setImage("")} 
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow"
                    title="Hapus gambar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMediaTarget("featured");
                    setIsMediaModalOpen(true);
                  }}
                  className="w-full aspect-video border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span>Atur gambar unggulan</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
              Kategori
            </div>
            <div className="p-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500"
              >
                <option value="Berita Utama">Berita Utama</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Agenda">Agenda</option>
                <option value="Prestasi">Prestasi</option>
              </select>
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
                placeholder="Nama Penulis"
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white outline-none focus:border-blue-500"
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

export default PostEditor;
