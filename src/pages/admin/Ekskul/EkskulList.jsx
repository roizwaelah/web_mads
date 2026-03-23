import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { Image as ImageIcon, Medal, Plus } from "lucide-react";
import { safeJson } from "../../../utils/http";

const PAGE_SIZE = 10;

const EkskulList = ({ showToast, ekskul, setEkskul }) => {
  const { openModal } = useModal();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const didFetchRef = useRef(false);
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (Array.isArray(ekskul) && ekskul.length > 0) return;
    if (typeof setEkskul !== "function") return;
    let active = true;
    const loadEkskul = async () => {
      try {
        const res = await fetch(`/api/ekskul.php?ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          setEkskul(data.data || []);
        } else {
          showToast?.(data.message || "Gagal memuat data ekskul.");
        }
      } catch {
        if (active) showToast?.("Koneksi server gagal.");
      }
    };
    loadEkskul();
    return () => {
      active = false;
    };
  }, []);

  const filteredEkskul = useMemo(() => {
    if (!search) return ekskul;
    const q = search.toLowerCase();
    return ekskul.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.status?.toLowerCase().includes(q),
    );
  }, [ekskul, search]);

  const totalPages = Math.ceil(filteredEkskul.length / PAGE_SIZE);
  const paginatedEkskul = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEkskul.slice(start, start + PAGE_SIZE);
  }, [filteredEkskul, page]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < paginatedEkskul.length;
    }
  }, [selectedIds, paginatedEkskul]);

  const handleEdit = (item) => {
    navigate(`/admin/ekskul/edit/${item.id}`);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedEkskul.map((i) => i.id);
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
      showToast("Pilih minimal satu ekskul.");
      return;
    }

    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Ekskul Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} ekskul?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/ekskul.php?id=${id}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );

            setEkskul(ekskul.filter((e) => !selectedIds.includes(e.id)));
            setSelectedIds([]);
            setBulkAction("");

            showToast("Ekskul berhasil dihapus.");
          } catch {
            showToast("Koneksi server gagal.");
          }
        },
      });
    }
  };

  const handleDelete = (id) => {
    openModal({
      title: "Hapus Ekskul?",
      content: "Yakin ingin menghapus kegiatan ekstrakurikuler ini?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `/api/ekskul.php?id=${id}`,
            { method: "DELETE" },
          );
          const result = await safeJson(response).catch(() => ({}));
          if (result.status === "success") {
            setEkskul(ekskul.filter((item) => item.id !== id));
            showToast("Ekskul berhasil dihapus.");
          } else {
            showToast(result.message);
          }
        } catch (error) {
          showToast("Koneksi ke server gagal.");
        }
      },
    });
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <Medal className="w-6 h-6 text-[#2271b1]" />
          Manajemen Ekstrakurikuler
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
            placeholder="Cari ekskul..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <button
            onClick={() => {
              navigate("/admin/ekskul/edit");
            }}
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
                    paginatedEkskul.length > 0 &&
                    selectedIds.length === paginatedEkskul.length
                  }
                />
              </th>
              <th className="p-3 font-semibold w-24">Gambar</th>
              <th className="p-3 font-semibold">Nama Ekskul</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEkskul.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  Belum ada data ekskul.
                </td>
              </tr>
            ) : (
              paginatedEkskul.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectOne(item.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200">
                      {item.image || item.img ? (
                        <img
                          src={item.image || item.img}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="font-semibold text-blue-600 hover:underline text-left text-base"
                    >
                      {item.name}
                    </button>
                    <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:underline"
                      >
                        Sunting
                      </button>{" "}
                      |
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          {filteredEkskul.length} ekskul ditemukan
        </span>
        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            {"<"}
          </button>
          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`border px-3 py-1 rounded ${
                  p === page ? "bg-gray-200 font-semibold" : ""
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EkskulList;
