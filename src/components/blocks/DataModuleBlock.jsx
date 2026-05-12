import React, { useEffect, useMemo, useState } from "react";
import { useNode } from "@craftjs/core";

const looksLikeImage = (value = "") =>
  /\.(png|jpe?g|gif|webp|svg)$/i.test((value || "").toString().trim());

const pickField = (fields = [], keys = []) => {
  for (const key of keys) {
    const found = fields.find((f) => (f.name || "").toLowerCase().includes(key));
    if (found) return found;
  }
  return null;
};

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

export const DataModuleBlock = ({ moduleId = "", showHeader = false }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const [modules, setModules] = useState([]);
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetch("/api/modules.php")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") setModules(json.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!moduleId) {
      setEntries([]);
      setTotal(0);
      setPage(1);
      return;
    }
    const active = modules.find((m) => String(m.id) === String(moduleId));
    const sortField = active?.sort_field || "";
    const sortDirection = active?.sort_direction || "asc";
    const sortType = (() => {
      if (!sortField || sortField === "created_at") return "";
      const field = active?.fields?.find((f) => f.name === sortField);
      if (!field) return "";
      if (field.type === "number") return "number";
      if (field.type === "date") return "date";
      return "";
    })();

    fetch(
      `/api/module_entries.php?module_id=${moduleId}&page=${page}&limit=${PAGE_SIZE}&sort_field=${encodeURIComponent(sortField)}&sort_direction=${encodeURIComponent(sortDirection)}&sort_type=${encodeURIComponent(sortType)}`,
    )
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          setEntries(json.data || []);
          setTotal(json.total || 0);
        }
      })
      .catch(() => {});
  }, [moduleId, page, modules]);

  const activeModule = useMemo(
    () => modules.find((m) => String(m.id) === String(moduleId)),
    [modules, moduleId],
  );

  const fields = useMemo(
    () => (activeModule?.fields && Array.isArray(activeModule.fields) ? activeModule.fields : []),
    [activeModule],
  );

  const imageField =
    fields.find((f) => f.type === "image") || pickField(fields, ["image", "gambar", "foto", "img"]);
  const titleField = pickField(fields, ["title", "judul", "nama"]) || fields[0];
  const descField =
    fields.find((f) => f.type === "textarea") || pickField(fields, ["deskripsi", "keterangan", "ringkasan"]);
  const linkField = fields.find((f) => f.type === "url") || pickField(fields, ["tautan", "url", "link"]);

  const renderTable = (items) => (
    <div className="overflow-x-auto text-sm">
      <table className="w-full text-left border border-gray-200">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {fields.map((field) => (
              <th key={field.name} className="p-3 font-semibold text-gray-700">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((entry) => (
            <tr key={entry.id}>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCards = (isGrid, items) => {
    const cols = activeModule?.grid_columns || 3;
    const gridClass =
      cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3";

    return (
      <div className={`grid grid-cols-1 ${isGrid ? gridClass : "md:grid-cols-2"} gap-4 text-sm`}>
        {items.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            {imageField && looksLikeImage(entry.data?.[imageField.name] || "") && (
              <img
                src={entry.data?.[imageField.name]}
                alt={entry.data?.[titleField?.name] || titleField?.label || "Gambar"}
                className="w-full h-40 object-cover rounded-lg mb-3 border border-gray-100"
              />
            )}
            <div className="font-semibold text-gray-800 text-base mb-1">
              <span style={textStyleForField(titleField)}>{titleField ? entry.data?.[titleField.name] || "-" : "-"}</span>
            </div>
            {descField && (
              <div className="text-gray-600 mb-2" style={textStyleForField(descField)}>
                {entry.data?.[descField.name] || "-"}
              </div>
            )}
            {linkField && entry.data?.[linkField.name] && (
              <a href={entry.data?.[linkField.name]} target="_blank" rel="noreferrer" className="text-[#2271b1] font-semibold hover:underline">
                Lihat Detail
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderList = (items) => (
    <div className="space-y-4 text-sm">
      {items.map((entry) => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 flex gap-3">
          {imageField && looksLikeImage(entry.data?.[imageField.name] || "") && (
            <img
              src={entry.data?.[imageField.name]}
              alt={entry.data?.[titleField?.name] || titleField?.label || "Gambar"}
              className="w-24 h-24 object-cover rounded-lg border border-gray-100 shrink-0"
            />
          )}
            <div>
            <div className="font-semibold text-gray-800 mb-1" style={textStyleForField(titleField)}>
              {titleField ? entry.data?.[titleField.name] || "-" : "-"}
            </div>
            {descField && (
              <div className="text-gray-600" style={textStyleForField(descField)}>
                {entry.data?.[descField.name] || "-"}
              </div>
            )}
            </div>
          </div>
      ))}
    </div>
  );

  const displayType = activeModule?.display_type || "table";
  const sortedEntries = entries;

  return (
    <div ref={(ref) => connect(drag(ref))} className="py-6 bg-white border rounded-lg border-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        {showHeader && activeModule?.title && <h3 className="text-xl font-bold text-gray-800 mb-4">{activeModule.title}</h3>}

        {!moduleId ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">Pilih module terlebih dahulu.</div>
        ) : fields.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">Module belum memiliki field.</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-6 text-center">Belum ada data untuk module ini.</div>
        ) : displayType === "card" ? (
          renderCards(false, sortedEntries)
        ) : displayType === "grid" ? (
          renderCards(true, sortedEntries)
        ) : displayType === "list" ? (
          renderList(sortedEntries)
        ) : (
          renderTable(sortedEntries)
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} data</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border px-2 py-1 rounded disabled:opacity-40">
                {"<"}
              </button>
              {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`border px-3 py-1 rounded ${p === page ? "bg-gray-200 font-semibold" : ""}`}>
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
      </div>
    </div>
  );
};

const DataModuleBlockSettings = () => {
  const {
    actions: { setProp },
    moduleId,
  } = useNode((node) => ({
    moduleId: node.data.props.moduleId,
  }));
  const [modules, setModules] = useState([]);

  useEffect(() => {
    fetch("/api/modules.php")
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") setModules(json.data || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Module</label>
        <select
          value={moduleId || ""}
          onChange={(e) =>
            setProp((props) => {
              props.moduleId = e.target.value;
            })
          }
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="">Pilih Module</option>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

DataModuleBlock.craft = {
  displayName: "Data Module",
  props: {
    moduleId: "",
    showHeader: false,
  },
  related: {
    settings: DataModuleBlockSettings,
  },
};
