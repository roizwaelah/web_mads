import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Database, Plus, Save } from "lucide-react";

const DEFAULT_FIELD = () => ({
  id: `field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label: "Field Baru",
  name: "field_baru",
  type: "text",
  required: false,
  options: "",
});

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

const ModuleEditor = ({ modules = [], setModules = () => {}, showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = id ? modules.find((m) => m.id.toString() === id) : null;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [fields, setFields] = useState([DEFAULT_FIELD()]);
  const [displayType, setDisplayType] = useState("table");
  const [gridColumns, setGridColumns] = useState(3);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title || "");
      setSlug(editing.slug || "");
      setDisplayType(editing.display_type || "table");
      setGridColumns(editing.grid_columns || 3);
      setSortField(editing.sort_field || "");
      setSortDirection(editing.sort_direction || "asc");
      setFields(
        Array.isArray(editing.fields) && editing.fields.length > 0
          ? editing.fields.map((f) => ({
              id: f.id || `field-${Date.now()}-${Math.random()}`,
              label: f.label || "",
              name: f.name || nameify(f.label),
              type: f.type || "text",
              required: Boolean(f.required),
              options: f.options || "",
            }))
          : [DEFAULT_FIELD()],
      );
    } else {
      setTitle("");
      setSlug("");
      setFields([DEFAULT_FIELD()]);
      setDisplayType("table");
      setGridColumns(3);
      setSortField("");
      setSortDirection("asc");
    }
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
              onChange={(e) => setDisplayType(e.target.value)}
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
              <option value="asc">A-Z / Lama â†’ Baru</option>
              <option value="desc">Z-A / Baru â†’ Lama</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-800">Field Module</div>
            <div className="text-xs text-gray-500">
              Tentukan kolom data yang akan diisi admin.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFields((prev) => [...prev, DEFAULT_FIELD()])}
            className="text-xs border border-gray-300 px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Tambah Field
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div key={field.id} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">
                  Field #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFields((prev) => prev.filter((f) => f.id !== field.id))
                  }
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
                        f.id === field.id
                          ? {
                              ...f,
                              label: e.target.value,
                              name: f.name || nameify(e.target.value),
                            }
                          : f,
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
                      prev.map((f) =>
                        f.id === field.id ? { ...f, name: e.target.value } : f,
                      ),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm"
                />
                <select
                  value={field.type}
                  onChange={(e) =>
                    setFields((prev) =>
                      prev.map((f) =>
                        f.id === field.id ? { ...f, type: e.target.value } : f,
                      ),
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
                  <option value="select">Select</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((f) =>
                          f.id === field.id
                            ? { ...f, required: e.target.checked }
                            : f,
                        ),
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
                      prev.map((f) =>
                        f.id === field.id ? { ...f, options: e.target.value } : f,
                      ),
                    )
                  }
                  className="border border-gray-200 rounded px-3 py-2 text-sm mt-3 w-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleEditor;

