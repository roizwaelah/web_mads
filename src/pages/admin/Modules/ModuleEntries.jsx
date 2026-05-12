import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Database, Plus, X } from "lucide-react";
import { useModal } from "../../../context/ModalContext";
import MediaModal from "../../../components/ui/MediaModal";

const PAGE_SIZE = 10;

const emptyValuesFromFields = (fields = []) => {
  const next = {};
  fields.forEach((field) => {
    next[field.name] = "";
  });
  return next;
};

const looksLikeImage = (value = "") =>
  /\.(png|jpe?g|gif|webp|svg)$/i.test((value || "").toString().trim());

const parseFieldOptions = (rawOptions) => {
  if (!rawOptions) return {};
  if (typeof rawOptions === "object") return rawOptions;
  try {
    const parsed = JSON.parse(rawOptions);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const textStyleForField = (field) => {
  const opts = parseFieldOptions(field?.options);
  const style = {};
  if (opts.fontSize) style.fontSize = `${opts.fontSize}px`;
  if (opts.fontWeight) style.fontWeight = opts.fontWeight;
  if (opts.color) style.color = opts.color;
  return style;
};

const ModuleEntries = ({ modules = [], showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openModal } = useModal();

  const moduleId = id ? parseInt(id, 10) : 0;
  const moduleData = modules.find((m) => m.id === moduleId);

  const [entries, setEntries] = useState([]);
  const [entryValues, setEntryValues] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeImageField, setActiveImageField] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fields = useMemo(
    () => (Array.isArray(moduleData?.fields) ? moduleData.fields : []),
    [moduleData],
  );

  const loadEntries = async (targetPage = page) => {
    if (!moduleId) return;
    try {
      const res = await fetch(
        `/api/module_entries.php?module_id=${moduleId}&page=${targetPage}&limit=${PAGE_SIZE}`,
      );
      const data = await res.json();
      if (data.status === "success") {
        setEntries(data.data || []);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadEntries(page);
  }, [moduleId, page]);

  useEffect(() => {
    setEntryValues(emptyValuesFromFields(fields));
  }, [fields]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((entry) =>
      fields.some((field) =>
        (entry.data?.[field.name] || "").toString().toLowerCase().includes(q),
      ),
    );
  }, [entries, fields, search]);

  const resetForm = () => {
    setEditingId(null);
    setMessage("");
    setEntryValues(emptyValuesFromFields(fields));
  };

  const handleSelectMedia = (item) => {
    if (!activeImageField) return;
    const selectedUrl = item?.url || "";
    setEntryValues((prev) => ({
      ...prev,
      [activeImageField]: selectedUrl,
    }));
    setIsMediaModalOpen(false);
    setActiveImageField("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const res = await fetch("/api/module_entries.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || null,
          module_id: moduleId,
          data: entryValues,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast?.(editingId ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.");
        setShowForm(false);
        resetForm();
        setPage(1);
        await loadEntries(1);
      } else {
        setMessage(data.message || "Gagal menyimpan data.");
      }
    } catch {
      setMessage("Koneksi server gagal.");
    }
  };

  const handleDelete = (entryId) => {
    openModal({
      title: "Hapus Data?",
      content: "Data yang dihapus tidak dapat dikembalikan.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/module_entries.php?id=${entryId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.status === "success") {
            setEntries((prev) => prev.filter((row) => row.id !== entryId));
            showToast?.("Data berhasil dihapus.");
          } else {
            showToast?.(data.message || "Gagal menghapus data.");
          }
        } catch {
          showToast?.("Koneksi server gagal.");
        }
      },
    });
  };

  if (!moduleData) {
    return <div className="text-center text-gray-500">Module tidak ditemukan.</div>;
  }

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#2271b1]" />
          <h1 className="text-[23px] font-normal text-[#1d2327]">
            Manajemen {moduleData.title}
          </h1>
        </div>
        <button
          onClick={() => navigate("/admin/modules")}
          className="text-sm text-gray-500 hover:text-[#2271b1] flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Module
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="text-[13px] text-gray-600">
          Kelola data untuk module <span className="font-semibold">{moduleData.title}</span>.
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari data..."
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
                return;
              }
              setShowForm(true);
            }}
            className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Tutup Form" : "Tambah Data"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-sm p-4 mb-6">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            {editingId ? "Sunting Data" : "Tambah Data"}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field) => (
              <div key={field.id || field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="text-xs text-gray-600 mb-1 block">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    rows="3"
                    value={entryValues[field.name] || ""}
                    onChange={(e) =>
                      setEntryValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={entryValues[field.name] || ""}
                    onChange={(e) =>
                      setEntryValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  >
                    <option value="">Pilih</option>
                    {(field.options || "")
                      .split(",")
                      .map((opt) => opt.trim())
                      .filter(Boolean)
                      .map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : field.type === "image" ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="https://.../gambar.jpg atau /uploads/gambar.jpg"
                      value={entryValues[field.name] || ""}
                      onChange={(e) =>
                        setEntryValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveImageField(field.name);
                        setIsMediaModalOpen(true);
                      }}
                      className="text-xs border border-[#2271b1] text-[#2271b1] px-3 py-1 rounded hover:bg-[#2271b1] hover:text-white transition"
                    >
                      Pilih dari Media
                    </button>
                    {looksLikeImage(entryValues[field.name]) && (
                      <img
                        src={entryValues[field.name]}
                        alt={field.label}
                        className="w-24 h-16 object-cover rounded border border-gray-200"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type || "text"}
                    value={entryValues[field.name] || ""}
                    onChange={(e) =>
                      setEntryValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                className="text-sm border border-[#2271b1] text-[#2271b1] px-4 py-2 rounded hover:bg-[#2271b1] hover:text-white transition font-semibold"
              >
                {editingId ? "Simpan Perubahan" : "Tambah Data"}
              </button>
              {message && <span className="text-sm text-gray-500">{message}</span>}
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-x-auto text-[13px]">
        <table className="w-full text-left">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              {fields.map((field) => (
                <th key={field.name} className="p-3 font-semibold">
                  {field.label}
                </th>
              ))}
              <th className="p-3 font-semibold w-40">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 1} className="p-6 text-center text-gray-500">
                  Belum ada data.
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  {fields.map((field) => (
                    <td key={field.name} className="p-3 text-gray-600">
                      {field.type === "image" && looksLikeImage(entry.data?.[field.name] || "") ? (
                        <img
                          src={entry.data?.[field.name]}
                          alt={field.label}
                          className="w-20 h-14 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <span style={textStyleForField(field)}>{entry.data?.[field.name] || "-"}</span>
                      )}
                    </td>
                  ))}
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-[12px]">
                      <button
                        onClick={() => {
                          setShowForm(true);
                          setEditingId(entry.id);
                          const next = {};
                          fields.forEach((field) => {
                            next[field.name] = entry.data?.[field.name] || "";
                          });
                          setEntryValues(next);
                        }}
                        className="text-[#2271b1] font-bold hover:underline"
                      >
                        Edit
                      </button>
                      |
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-500 font-bold hover:underline ml-1"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{total} data</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border px-2 py-1 rounded disabled:opacity-40"
            >
              {"<"}
            </button>
            {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`border px-3 py-1 rounded ${p === page ? "bg-gray-200 font-semibold" : ""}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
              disabled={page >= Math.ceil(total / PAGE_SIZE)}
              className="border px-2 py-1 rounded disabled:opacity-40"
            >
              {">"}
            </button>
          </div>
        </div>
      )}

      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setActiveImageField("");
        }}
        onInsert={handleSelectMedia}
      />
    </div>
  );
};

export default ModuleEntries;
