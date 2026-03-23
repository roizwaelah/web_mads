import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { CalendarDays, Plus } from "lucide-react";
import { safeJson } from "../../../utils/http";

const PAGE_SIZE = 10;

const AgendaList = ({ navigate, showToast, agendas, setAgendas }) => {
  const routerNavigate = useNavigate();
  const goTo = typeof navigate === "function" ? navigate : routerNavigate;
  const { openModal } = useModal();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const didFetchRef = useRef(false);
  const selectAllRef = useRef(null);

  const fetchAgendas = async () => {
    if (typeof setAgendas !== "function") return;
    try {
      const res = await fetch(`/api/agenda.php?ts=${Date.now()}`, { cache: "no-store" });
      const data = await safeJson(res);
      if (data.status === "success") {
        setAgendas(data.data || []);
      } else {
        showToast?.(data.message || "Gagal memuat data agenda.");
      }
    } catch {
      showToast?.("Koneksi server gagal.");
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (Array.isArray(agendas) && agendas.length > 0) return;
    fetchAgendas();
  }, []);

  useEffect(() => {
    const onAgendasUpdated = () => fetchAgendas();
    const onStorage = (event) => {
      if (event.key === "agendas-updated-at") fetchAgendas();
    };
    const onFocus = () => fetchAgendas();
    window.addEventListener("agendas-updated", onAgendasUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("agendas-updated", onAgendasUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filteredAgendas = useMemo(() => {
    if (!search) return agendas;
    const q = search.toLowerCase();
    return agendas.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.status?.toLowerCase().includes(q),
    );
  }, [agendas, search]);

  const totalPages = Math.ceil(filteredAgendas.length / PAGE_SIZE);
  const paginatedAgendas = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAgendas.slice(start, start + PAGE_SIZE);
  }, [filteredAgendas, page]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < paginatedAgendas.length;
    }
  }, [selectedIds, paginatedAgendas]);

  const handleEdit = (item) => {
    goTo(`edit/${item.id}`);
  };

  const handleAddNew = () => {
    goTo("edit");
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedAgendas.map((a) => a.id);
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
      showToast("Pilih minimal satu agenda.");
      return;
    }

    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Agenda Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} agenda?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/agenda.php?id=${id}&ts=${Date.now()}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );

            setAgendas(agendas.filter((a) => !selectedIds.includes(a.id)));
            setSelectedIds([]);
            setBulkAction("");

            showToast("Agenda berhasil dihapus.");
            try {
              localStorage.setItem("agendas-updated-at", String(Date.now()));
            } catch {
              // ignore
            }
            window.dispatchEvent(new Event("agendas-updated"));
          } catch {
            showToast("Koneksi server gagal.");
          }
        },
      });
    }
  };

  const handleDelete = (id) => {
    openModal({
      title: "Hapus Agenda?",
      content: "Apakah Anda yakin ingin menghapus agenda ini secara permanen?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(
            `/api/agenda.php?id=${id}&ts=${Date.now()}`,
            { method: "DELETE" },
          );
          const result = await safeJson(response).catch(() => ({}));
          if (result.status === "success") {
            setAgendas(agendas.filter((item) => item.id !== id));
            showToast("Agenda berhasil dihapus.");
            try {
              localStorage.setItem("agendas-updated-at", String(Date.now()));
            } catch {
              // ignore
            }
            window.dispatchEvent(new Event("agendas-updated"));
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
          <CalendarDays className="w-6 h-6 text-[#2271b1]" />
          Manajemen Agenda
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
            placeholder="Cari agenda..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <button
            onClick={handleAddNew}
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
                    paginatedAgendas.length > 0 &&
                    selectedIds.length === paginatedAgendas.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Nama Acara</th>
              <th className="p-3 font-semibold">Tanggal & Waktu</th>
              <th className="p-3 font-semibold">Lokasi</th>
              <th className="p-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedAgendas.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  Belum ada agenda kegiatan.
                </td>
              </tr>
            ) : (
              paginatedAgendas.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectOne(item.id)}
                    />
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="font-semibold text-blue-600 hover:underline text-left"
                    >
                      {item.title}
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
                  <td className="p-3 text-gray-600">
                    <span className="font-medium">{item.formatted_date}</span>
                    {item.event_time && (
                      <span className="block text-xs text-gray-400">
                        {item.event_time}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{item.location || "-"}</td>
                  <td className="p-3 text-gray-500">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          {filteredAgendas.length} agenda ditemukan
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

export default AgendaList;
