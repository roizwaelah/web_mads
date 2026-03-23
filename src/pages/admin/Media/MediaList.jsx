import React, { useRef, useState, useEffect } from "react";
import { normalizeMediaUrl, safeJson } from "../../../utils/http";
import {
  Image as ImageIcon,
  List,
  LayoutGrid,
  FileText,
  Upload,
  Trash2,
  X
} from "lucide-react";

import { useModal } from "../../../context/ModalContext";

const API = "/api/media.php";

const MediaList = ({ showToast }) => {

  const { openModal } = useModal();

  const fileInputRef = useRef(null);
  const observerRef = useRef();

  const [mediaItems, setMediaItems] = useState([]);
  const [selected, setSelected] = useState([]);

  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [isUploading, setIsUploading] = useState(false);



  /* ===============================
     LOAD MEDIA (LAZY)
  =============================== */

  const loadMedia = async (pageNumber = 1, reset = false) => {

    let url = `${API}?page=${pageNumber}&limit=20&ts=${Date.now()}`;

    if (filter) url += `&type=${filter}`;

    const res = await fetch(url);
    const data = await safeJson(res);

    if (data.status === "success") {

      if (reset) {
        setMediaItems(data.data);
      } else {
        setMediaItems(prev => [...prev, ...data.data]);
      }

      setHasMore(data.pagination.has_more);
    }
  };



  /* ===============================
     FIRST LOAD
  =============================== */

  useEffect(() => {
    loadMedia(1, true);
  }, [filter]);



  /* ===============================
     LAZY LOAD ON SCROLL
  =============================== */

  const lastItemRef = node => {

    if (!hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {

      if (entries[0].isIntersecting) {

        const next = page + 1;

        setPage(next);
        loadMedia(next);
      }
    });

    if (node) observerRef.current.observe(node);
  };



  /* ===============================
     FILE UPLOAD
  =============================== */

  const handleUpload = async e => {

    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);

    const form = new FormData();
    form.append("file", file);

    try {

      const res = await fetch(API, {
        method: "POST",
        body: form
      });

      const data = await safeJson(res);

      if (data.status === "success") {
        if (data?.data?.url) {
          data.data.url = normalizeMediaUrl(data.data.url);
        }

        setMediaItems(prev => [data.data, ...prev]);

        showToast?.("Upload berhasil", "success");

      } else {

        showToast?.(data.message);
      }

    } catch (err) {

      showToast?.("Upload gagal");

    } finally {

      setIsUploading(false);

      if (fileInputRef.current)
        fileInputRef.current.value = "";
    }
  };



  /* ===============================
     SELECT MEDIA
  =============================== */

  const toggleSelect = id => {

    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };



  /* ===============================
     DELETE MEDIA
  =============================== */

  const deleteMedia = ids => {

    openModal({
      title: "Hapus Media",
      message: `Hapus ${ids.length} media?`,
      confirmText: "Hapus",

      onConfirm: async () => {

        const res = await fetch(API, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ids })
        });

        const data = await safeJson(res);

        if (data.status === "success") {

          setMediaItems(prev =>
            prev.filter(item => !ids.includes(item.id))
          );

          setSelected([]);

          showToast?.("Media berhasil dihapus", "success");
        }
      }
    });
  };



  /* ===============================
     RENDER ITEM
  =============================== */

  const renderItem = (item, index) => {

    const ref =
      index === mediaItems.length - 1
        ? lastItemRef
        : null;

    if (view === "grid") {

      return (
        <div
          key={item.id}
          ref={ref}
          className={`aspect-square border rounded overflow-hidden relative group
          ${selected.includes(item.id)
            ? "ring-2 ring-blue-500"
            : ""
          }`}
        >

          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => toggleSelect(item.id)}
            className="absolute top-2 left-2 z-10"
          />

          {item.type === "image" ? (
            <img
              src={normalizeMediaUrl(item.url)}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="w-10 h-10 text-red-500 mb-2" />
              <span className="text-xs px-2 truncate">
                {item.name}
              </span>
            </div>
          )}

        </div>
      );
    }

    return (
      <div
        key={item.id}
        ref={ref}
        className="flex items-center gap-3 p-3 border-b"
      >

        <input
          type="checkbox"
          checked={selected.includes(item.id)}
          onChange={() => toggleSelect(item.id)}
        />

        {item.type === "image" ? (
          <img
            src={normalizeMediaUrl(item.url)}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <FileText className="w-6 h-6 text-red-500" />
        )}

        <span className="text-sm">{item.name}</span>

      </div>
    );
  };



  /* ===============================
     UI
  =============================== */

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <h1 className="text-2xl mb-4 flex items-center gap-2">
        <ImageIcon className="w-6 h-6 text-[#2271b1]" />
        Pustaka Media
      </h1>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">

        <button
          onClick={() => setView("list")}
          className={`p-1 ${view === "list"
            ? "text-[#2271b1]"
            : "text-gray-500"
          }`}
        >
          <List className="w-5 h-5" />
        </button>

        <button
          onClick={() => setView("grid")}
          className={`p-1 ${view === "grid"
            ? "text-[#2271b1]"
            : "text-gray-500"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <select
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="border rounded px-2 py-1"
        >
          <option value="">Semua media</option>
          <option value="image">Gambar</option>
          <option value="document">Dokumen</option>
        </select>

        <button
          disabled={selected.length === 0}
          onClick={() => deleteMedia(selected)}
          className="flex items-center gap-2 border px-3 py-1 rounded disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          Hapus
        </button>

        <div className="flex-1"></div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={isUploading}
          className="border border-[#2271b1] text-[#2271b1] px-3 py-1 rounded flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Mengunggah..." : "Tambah Baru"}
        </button>

      </div>

      {view === "grid" ? (

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">

          {mediaItems.map((item, index) =>
            renderItem(item, index)
          )}

        </div>

      ) : (

        <div className="border rounded">

          {mediaItems.map((item, index) =>
            renderItem(item, index)
          )}

        </div>

      )}

    </div>
  );
};

MediaList.defaultProps = {
  showToast: () => {}
};

export default MediaList;



