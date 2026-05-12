import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Database, Plus, Save } from "lucide-react";

const slugify = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const nameify = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

const mkField = (field = {}) => ({
  id: `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label: field.label || "Field Baru",
  name: field.name || nameify(field.label || "field_baru"),
  type: field.type || "text",
  required: Boolean(field.required),
  options: field.options || "",
});

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

const toFieldOptionsString = (obj) => {
  try {
    return JSON.stringify(obj || {});
  } catch {
    return "";
  }
};

const TEMPLATE_FIELDS = {
  table: [
    { label: "Nama", name: "nama", type: "text", required: true },
    { label: "Keterangan", name: "keterangan", type: "textarea" },
  ],
  card: [
    { label: "Judul", name: "judul", type: "text", required: true },
    { label: "Gambar", name: "gambar", type: "image" },
    { label: "Deskripsi", name: "deskripsi", type: "textarea" },
    { label: "Tautan", name: "tautan", type: "url" },
  ],
  grid: [
    { label: "Judul", name: "judul", type: "text", required: true },
    { label: "Gambar", name: "gambar", type: "image" },
    { label: "Deskripsi Singkat", name: "deskripsi_singkat", type: "textarea" },
  ],
  list: [
    { label: "Judul", name: "judul", type: "text", required: true },
    { label: "Subjudul", name: "subjudul", type: "text" },
    { label: "Deskripsi", name: "deskripsi", type: "textarea" },
  ],
};

const ModuleEditor = ({ modules = [], setModules = () => {}, showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id ? modules.find((m) => m.id.toString() === id) : null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [fields, setFields] = useState([mkField()]);
  const [displayType, setDisplayType] = useState("table");
  const [gridColumns, setGridColumns] = useState(3);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const applyDisplayTemplate = (type) => {
    const template = TEMPLATE_FIELDS[type] || TEMPLATE_FIELDS.table;
    setFields(template.map((f) => mkField(f)));
    setSortField("");
    setSortDirection("asc");
  };

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      if (editing) {
        setTitle(editing.title || "");
        setSlug(editing.slug || "");
        setDisplayType(editing.display_type || "table");
        setGridColumns(editing.grid_columns || 3);
        setSortField(editing.sort_field || "");
        setSortDirection(editing.sort_direction || "asc");
        setFields(
          Array.isArray(editing.fields) && editing.fields.length > 0
            ? editing.fields.map((f) =>
                mkField({
                  label: f.label || "",
                  name: f.name || nameify(f.label),
                  type: f.type || "text",
                  required: Boolean(f.required),
                  options: f.options || "",
                }),
              )
            : (TEMPLATE_FIELDS[editing.display_type || "table"] || TEMPLATE_FIELDS.table).map((f) =>
                mkField(f),
              ),
        );
      } else {
        setTitle("");
        setSlug("");
        setDisplayType("table");
        setGridColumns(3);
        setSortField("");
        setSortDirection("asc");
        applyDisplayTemplate("table");
      }
    });

    return () => {
      active = false;
    };
  }, [editing, id]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const handleSave = async () => {
    if (!canSave) {
      showToast?.("Nama module wajib diisi.");
      return;
    }

    const payload = {
      id: editing?.id || null,
      title,
      slug: slugify(slug || title),
      display_type: displayType,
      grid_columns: gridColumns,
      sort_field: sortField || null,
      sort_direction: sortDirection,
      fields,
    };

    try {
      const res = await fetch("/api/modules.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        const resModules = await fetch("/api/modules.php");
        const moduleData = await resModules.json();
        if (moduleData.status === "success") setModules(moduleData.data);
        showToast?.("Module berhasil disimpan.");
        navigate("/admin/modules");
      } else {
        showToast?.(data.message || "Gagal menyimpan module.");
      }
    } catch {
      showToast?.("Koneksi server gagal.");
    }
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#2271b1]" />
          <h1 className="text-[23px] font-semibold text-[#1d2327]">
            {editing ? "Sunting Module" : "Buat Module Baru"}
          </h1>
        </div>
        <button
          onClick={handleSave}
          className="text-sm bg-[#2271b1] text-white px-4 py-2 rounded font-semibold flex items-center gap-2 hover:bg-[#135e96]"
        >
          <Save className="w-4 h-4" />
          Simpan
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500">Nama Module</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Tampilan Publik</label>
            <select
              value={displayType}
              onChange={(e) => {
                const nextType = e.target.value;
                setDisplayType(nextType);
                applyDisplayTemplate(nextType);
              }}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            >
              <option value="table">Tabel</option>
              <option value="card">Kartu</option>
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-xs text-gray-500">Kolom Grid</label>
            <select
              value={gridColumns}
              onChange={(e) => setGridColumns(Number(e.target.value))}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              disabled={displayType !== "grid"}
            >
              <option value={2}>2 Kolom</option>
              <option value={3}>3 Kolom</option>
              <option value={4}>4 Kolom</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Urutkan Berdasar</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
            >
              <option value="">Tidak diurutkan</option>
              <option value="created_at">Tanggal</option>
              {fields.map((field) => (
                <option key={field.id} value={field.name}>
                  {field.label || field.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Arah Urut</label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
              disabled={!sortField}
            >
              <option value="asc">A-Z / Lama ke Baru</option>
              <option value="desc">Z-A / Baru ke Lama</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">Field Module</div>
            <div className="text-xs text-gray-500">
              Field otomatis menyesuaikan tampilan publik, bisa Anda kustom lagi.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyDisplayTemplate(displayType)}
              className="text-xs border border-[#2271b1] text-[#2271b1] px-3 py-1 rounded bg-white hover:bg-[#2271b1] hover:text-white"
            >
              Reset Sesuai Tampilan
            </button>
            <button
              type="button"
              onClick={() => setFields((prev) => [...prev, mkField()])}
              className="text-xs border border-gray-300 px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah Field
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Field #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => setFields((prev) => prev.filter((f) => f.id !== field.id))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Hapus
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Label"
                  value={field.label}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) =>
                        f.id === field.id ? { ...f, label: e.target.value, name: f.name || nameify(e.target.value) } : f,
                      ),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Nama (key)"
                  value={field.name}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, name: e.target.value } : f)),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                />
                <select
                  value={field.type}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, type: e.target.value } : f)),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="tel">Telepon</option>
                  <option value="date">Tanggal</option>
                  <option value="url">URL</option>
                  <option value="image">Gambar (URL)</option>
                  <option value="select">Select</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((f) => (f.id === field.id ? { ...f, required: e.target.checked } : f)),
                      )
                    }
                  />
                  Wajib
                </label>
              </div>
              {field.type === "select" && (
                <input
                  type="text"
                  placeholder="Opsi dipisah koma (contoh: A, B, C)"
                  value={field.options || ""}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) => (f.id === field.id ? { ...f, options: e.target.value } : f)),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm mt-3 w-full"
                />
              )}
              {(field.type === "text" || field.type === "textarea" || field.type === "number") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-[11px] text-gray-500">Ukuran Teks (px)</label>
                    <input
                      type="number"
                      min="10"
                      max="60"
                      value={parseFieldOptions(field.options).fontSize || ""}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) => {
                            if (f.id !== field.id) return f;
                            const current = parseFieldOptions(f.options);
                            const next = {
                              ...current,
                              fontSize: e.target.value ? Number(e.target.value) : undefined,
                            };
                            if (!next.fontSize) delete next.fontSize;
                            return { ...f, options: toFieldOptionsString(next) };
                          }),
                        )
                      }
                      className="border border-gray-200 rounded px-3 py-2 text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500">Style Teks</label>
                    <select
                      value={parseFieldOptions(field.options).fontWeight || "normal"}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) => {
                            if (f.id !== field.id) return f;
                            const current = parseFieldOptions(f.options);
                            const next = { ...current, fontWeight: e.target.value };
                            return { ...f, options: toFieldOptionsString(next) };
                          }),
                        )
                      }
                      className="border border-gray-200 rounded px-3 py-2 text-sm w-full"
                    >
                      <option value="normal">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500">Warna Teks</label>
                    <input
                      type="color"
                      value={parseFieldOptions(field.options).color || "#374151"}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((f) => {
                            if (f.id !== field.id) return f;
                            const current = parseFieldOptions(f.options);
                            const next = { ...current, color: e.target.value };
                            return { ...f, options: toFieldOptionsString(next) };
                          }),
                        )
                      }
                      className="border border-gray-200 rounded h-[42px] w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleEditor;
