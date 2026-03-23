import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, File, Plus, Trash2, Download, X } from 'lucide-react';

import { safeJson } from '../../utils/http';
import { useModal } from "../../context/ModalContext";

const PAGE_SIZE = 10;

const Documents = ({ showToast }) => {
  const { openModal } = useModal();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [page, setPage] = useState(1);
  const selectAllRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [docName, setDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Ambil data dokumen dari API
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents.php?ts=${Date.now()}`, { cache: "no-store" });
      const result = await safeJson(response);
      if (result.status === "success") {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error("Gagal memuat dokumen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter((doc) => doc.name?.toLowerCase().includes(q));
  }, [documents, searchQuery]);

  const totalPages = Math.ceil(filteredDocs.length / PAGE_SIZE);
  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredDocs.slice(start, start + PAGE_SIZE);
  }, [filteredDocs, page]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < paginatedDocs.length;
    }
  }, [selectedIds, paginatedDocs]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedDocs.map((d) => d.id);
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
      showToast("Pilih minimal satu dokumen.");
      return;
    }
    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Dokumen Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} dokumen?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/documents.php?id=${id}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );
            setDocuments(documents.filter((d) => !selectedIds.includes(d.id)));
            setSelectedIds([]);
            setBulkAction("");
            showToast("Dokumen berhasil dihapus!");
          } catch (error) {
            showToast("Gagal menghapus dokumen.");
          }
        },
      });
    }
  };

  // Handle Unggah Dokumen
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !docName) {
      showToast("Nama dokumen dan file harus diisi!");
      return;
    }

    // Validasi tipe file (misal: PDF, DOC, Excel)
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      showToast("Format file tidak didukung! Gunakan PDF, DOC, atau XLS.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", docName);

    try {
      const response = await fetch("/api/documents.php", {
        method: "POST",
        body: formData,
      });
      const result = await safeJson(response);
      
      if (result.status === "success") {
        showToast("Dokumen berhasil diunggah!");
        setIsModalOpen(false);
        setDocName("");
        setSelectedFile(null);
        fetchDocuments(); // Refresh tabel
      } else {
        showToast(result.message || "Gagal mengunggah dokumen.");
      }
    } catch (error) {
      showToast("Terjadi kesalahan koneksi.");
    } finally {
      setUploading(false);
    }
  };

  // Handle Hapus Dokumen
  const handleDelete = (doc) => {
    openModal({
      title: "Hapus Dokumen?",
      content: `Yakin ingin menghapus dokumen ${doc.name}?`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/documents.php?id=${doc.id}`, {
            method: "DELETE",
          });
          const result = await safeJson(response);
          if (result.status === "success") {
            setDocuments(documents.filter((d) => d.id !== doc.id));
            showToast("Dokumen berhasil dihapus!");
          } else {
            showToast(result.message || "Gagal menghapus dokumen.");
          }
        } catch (error) {
          showToast("Gagal menghapus dokumen.");
        }
      },
    });
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <File className="w-6 h-6 text-[#2271b1]" />
          Manajemen Dokumen
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
            placeholder="Cari dokumen..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <button 
            onClick={() => setIsModalOpen(true)}
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
                    paginatedDocs.length > 0 &&
                    selectedIds.length === paginatedDocs.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Nama Dokumen</th>
              <th className="p-3 font-semibold w-28">Tipe</th>
              <th className="p-3 font-semibold w-40">Tanggal</th>
              <th className="p-3 font-semibold text-right w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : paginatedDocs.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-gray-500">Tidak ada dokumen ditemukan.</td></tr>
            ) : (
              paginatedDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => handleSelectOne(doc.id)}
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-800 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-blue-500" />
                    {doc.name}
                  </td>
                  <td className="p-3 text-gray-500 uppercase text-xs font-bold">
                    {doc.type || 'PDF'}
                  </td>
                  <td className="p-3 text-gray-500">{doc.created_at}</td>
                  <td className="p-3 flex justify-end gap-2">
                    <a 
                      href={`/api/${doc.url}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Unduh"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          {filteredDocs.length} dokumen ditemukan
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
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            {'>'}
          </button>
        </div>
      </div>

      {/* Modal Unggah Dokumen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-xl w-full max-w-md animate-[fadeIn_0.2s_ease-in]">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Unggah Dokumen Baru</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Dokumen</label>
                <input 
                  type="text" 
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Misal: SK Kelulusan 2026"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Berkas</label>
                <input 
                  type="file" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">Format: PDF, DOC, XLS. Maksimal 5MB.</p>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? "Mengunggah..." : "Simpan Dokumen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;


