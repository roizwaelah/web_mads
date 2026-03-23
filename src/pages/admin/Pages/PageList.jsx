import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { FileText, Plus } from "lucide-react";
import { safeJson } from "../../../utils/http";

// Hapus 'navigate' dari props
const PageList = ({ showToast, pages, setPages }) => {
  const { openModal } = useModal();
  const navigate = useNavigate(); // Inisialisasi navigate
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const selectAllRef = useRef(null);
  const didFetchRef = useRef(false);

  const decodeHtml = (value) => {
    if (!value) return "";
    return value
      .toString()
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  };

  const filteredPages = useMemo(() => {
    if (!search) return pages;
    const q = search.toLowerCase();
    return pages.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q),
    );
  }, [pages, search]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < filteredPages.length;
    }
  }, [selectedIds, filteredPages.length]);

  const fetchPages = async () => {
    if (typeof setPages !== "function") return;
    try {
      const res = await fetch(`/api/pages.php?ts=${Date.now()}`, { cache: "no-store" });
      const data = await safeJson(res);
      if (data.status === "success") {
        setPages(data.data || []);
      } else {
        showToast?.(data.message || "Gagal memuat data laman.");
      }
    } catch {
      showToast?.("Koneksi server gagal.");
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (Array.isArray(pages) && pages.length > 0) return;
    fetchPages();
  }, []);

  useEffect(() => {
    const onPagesUpdated = () => fetchPages();
    const onStorage = (event) => {
      if (event.key === "pages-updated-at") fetchPages();
    };
    const onFocus = () => fetchPages();
    window.addEventListener("pages-updated", onPagesUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("pages-updated", onPagesUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleDelete = (id) => {
    openModal({
      title: "Hapus Laman?",
      content: "Apakah Anda yakin ingin menghapus laman ini secara permanen?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `/api/pages.php?id=${id}`,
            { method: "DELETE" },
          );
          const result = await safeJson(response).catch(() => ({}));
          if (result.status === "success") {
            setPages(pages.filter((page) => page.id !== id));
            showToast("Laman berhasil dihapus permanen.");
          } else {
            showToast(result.message);
          }
        } catch (error) {
          showToast("Koneksi ke server gagal.");
        }
      },
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredPages.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openEditorTab = (id) => {
    const path = id ? `/admin/pages/editor/${id}` : "/admin/pages/editor";
    const win = window.open(path, "_blank", "noopener");
    if (!win) {
      navigate(path);
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      showToast("Pilih aksi terlebih dahulu.");
      return;
    }
    if (selectedIds.length === 0) {
      showToast("Pilih minimal satu laman.");
      return;
    }

    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Laman Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} laman?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/pages.php?id=${id}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );

            setPages(pages.filter((p) => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setBulkAction("");

            showToast("Laman berhasil dihapus.");
          } catch {
            showToast("Koneksi server gagal.");
          }
        },
      });
    }
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#2271b1]" />
          Manajemen Laman Statis
        </h1>
      </div>

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
            placeholder="Cari laman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />

          <button
            onClick={() => openEditorTab()}
            className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Tambah Baru
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
                    filteredPages.length > 0 &&
                    selectedIds.length === filteredPages.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Judul</th>
              <th className="p-3 font-semibold">Tautan (Slug)</th>
              <th className="p-3 font-semibold w-32">Penulis</th>
              <th className="p-3 font-semibold w-40">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  Belum ada laman ditemukan.
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(page.id)}
                      onChange={() => handleSelectOne(page.id)}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => openEditorTab(page.id)}
                      className="font-semibold text-[#2271b1] text-[14px] hover:underline text-left"
                    >
                      {decodeHtml(page.title)}{" "}
                      {page.status === "Draft" && (
                        <span className="text-gray-500 font-normal ml-1 text-[12px]">
                          Draft
                        </span>
                      )}
                    </button>
                    <div className="text-[13px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditorTab(page.id)}
                        className="text-[#2271b1] hover:underline"
                      >
                        Sunting
                      </button>{" "}
                      |
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="text-red-500 hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">/{page.slug}</td>
                  <td className="p-3 text-[#2271b1]">{page.author}</td>
                  <td className="p-3 text-gray-500 leading-tight">
                    <span className="font-medium text-gray-700">
                      {page.status}
                    </span>
                    <br />
                    {page.date}
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

export default PageList;

