import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, User, Calendar, Wrench } from 'lucide-react';
import { Editor, Frame } from '@craftjs/core';
import { ContainerBlock } from '../blocks/ContainerBlock';
import { TextBlock } from '../blocks/TextBlock';
import { ButtonBlock } from '../blocks/ButtonBlock';
import { CardBlock } from '../blocks/CardBlock';
import { GuruBlock } from '../blocks/GuruBlock';
import { FilesBlock } from '../blocks/FilesBlock';
import { FacilityBlock } from '../blocks/FacilityBlock';
import { RichTextBlock } from '../blocks/RichTextBlock';
import { DataModuleBlock } from '../blocks/DataModuleBlock';
import { GapBlock } from '../blocks/GapBlock';
import { LayoutBlock } from '../blocks/LayoutBlock';
import { SectionBlock } from '../blocks/SectionBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import { DividerBlock } from '../blocks/DividerBlock';
import { safeJson } from '../../utils/http';

export default function GenericPage({ pages = [], gurus = [] }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [moduleConfig, setModuleConfig] = useState(null);
  const [moduleEntries, setModuleEntries] = useState([]);
  const [modulePage, setModulePage] = useState(1);
  const [moduleTotal, setModuleTotal] = useState(0);
  const [remotePages, setRemotePages] = useState([]);
  const MODULE_PAGE_SIZE = 10;

  useEffect(() => {
    if (Array.isArray(pages) && pages.length > 0) return;
    let active = true;
    const loadPages = async () => {
      try {
        const res = await fetch(`/api/pages.php?ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          setRemotePages(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadPages();
    return () => {
      active = false;
    };
  }, [pages]);

  const pageSource = pages && pages.length > 0 ? pages : remotePages;

  const activeData = pageSource.find(p => 
    p.status?.toLowerCase() === 'publish' && 
    (p.slug === slug || p.title?.toLowerCase().includes(slug?.toLowerCase()))
  );
  
  const decodedTitle = useMemo(() => {
    if (!activeData?.title) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = activeData.title;
    return textarea.value;
  }, [activeData]);

  const parsedContent = useMemo(() => {
    if (!activeData?.content || typeof activeData.content !== 'string') return null;
    const raw = activeData.content.trim();
    if (!raw.startsWith('{')) return null;
    try {
      const json = JSON.parse(raw);
      return json && json.ROOT ? json : null;
    } catch {
      return null;
    }
  }, [activeData]);

  const parsedFormSchema = useMemo(() => {
    if (!activeData?.form_schema) return null;
    try {
      const schema =
        typeof activeData.form_schema === "string"
          ? JSON.parse(activeData.form_schema)
          : activeData.form_schema;
      if (!schema || typeof schema !== "object") return null;
      return schema;
    } catch {
      return null;
    }
  }, [activeData]);

  useEffect(() => {
    if (!parsedFormSchema?.fields || !activeData?.id) return;
    const initial = {};
    parsedFormSchema.fields.forEach((field) => {
      initial[field.name] = "";
    });
    setFormValues(initial);
  }, [parsedFormSchema, activeData?.id]);

  useEffect(() => {
    if (activeData?.page_type !== "form" || !activeData?.id) return;
    const controller = new AbortController();
    const loadSubmissions = async () => {
      try {
        const res = await fetch(
          `/api/form_submissions.php?page_id=${activeData.id}`,
          { signal: controller.signal },
        );
        const data = await safeJson(res);
        if (data.status === "success") {
          setSubmissions(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadSubmissions();
    return () => controller.abort();
  }, [activeData?.page_type, activeData?.id]);

  useEffect(() => {
    if (!activeData?.data_module_id) return;
    setModulePage(1);
    const controller = new AbortController();
    const loadModuleData = async () => {
      try {
        let found = null;
        const resModules = await fetch("/api/modules.php", {
          signal: controller.signal,
        });
        const dataModules = await safeJson(resModules);
        if (dataModules.status === "success") {
          found = (dataModules.data || []).find(
            (m) => m.id === activeData.data_module_id,
          );
          setModuleConfig(found || null);
        } else {
          setModuleConfig(null);
        }

        const sortField = found?.sort_field || "";
        const sortDirection = found?.sort_direction || "asc";
        const sortType = (() => {
          if (!sortField || sortField === "created_at") return "";
          const field = found?.fields?.find((f) => f.name === sortField);
          if (!field) return "";
          if (field.type === "number") return "number";
          if (field.type === "date") return "date";
          return "";
        })();

        const resEntries = await fetch(
          `/api/module_entries.php?module_id=${activeData.data_module_id}&page=${modulePage}&limit=${MODULE_PAGE_SIZE}&sort_field=${encodeURIComponent(sortField)}&sort_direction=${encodeURIComponent(sortDirection)}&sort_type=${encodeURIComponent(sortType)}`,
          { signal: controller.signal },
        );
        const dataEntries = await safeJson(resEntries);
        if (dataEntries.status === "success") {
          setModuleEntries(dataEntries.data || []);
          setModuleTotal(dataEntries.total || 0);
        }
      } catch {
        // ignore
      }
    };
    loadModuleData();
    return () => controller.abort();
  }, [activeData?.data_module_id, modulePage]);

  const renderComingSoon = (title) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-300 my-8 shadow-sm">
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-60 animate-pulse"></div>
        <div className="bg-white p-5 rounded-full shadow-md relative z-10 border border-gray-100">
          <Wrench className="w-12 h-12 text-red-600 animate-bounce" />
        </div>
      </div>
      <h3 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">Halaman Segera Hadir</h3>
      <p className="text-gray-500 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
        Konten untuk halaman <strong className="text-gray-700">ini</strong> sedang dalam tahap pengembangan. Kami sedang menyiapkan informasi terbaik untuk Anda.
      </p>
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 hover:-translate-y-0.5 transition-all duration-200 shadow-lg shadow-blue-200 cursor-pointer"
      >
        <Home className="w-5 h-5" />
        Kembali ke Beranda
      </button>
    </div>
  );

  const renderContent = () => {
    // Deteksi apakah konten kosong (string kosong, HTML kosong dari editor, atau CraftJS tanpa node)
    const isContentEmpty = !activeData?.content || 
      activeData.content.trim() === '' || 
      activeData.content.trim() === '<p></p>' || 
      activeData.content.trim() === '<p><br></p>' ||
      (parsedContent && Object.keys(parsedContent).length === 0);

    // Template Coming Soon
    if (isContentEmpty && activeData?.page_type !== "form" && !activeData?.data_module_id) {
      return renderComingSoon(decodedTitle);
    }

    if (isContentEmpty && (activeData?.page_type === "form" || activeData?.data_module_id)) {
      return null;
    }

    // Render CraftJS jika ada format JSON valid
    if (parsedContent) {
      return (
        <Editor
          key={activeData?.id || activeData?.slug || decodedTitle}
          enabled={false}
          resolver={{
            Container: ContainerBlock,
            Text: TextBlock,
            ButtonBlock,
            CardBlock,
            GuruBlock,
            FilesBlock,
            FacilityBlock,
            RichTextBlock,
            DataModuleBlock,
            GapBlock,
            LayoutBlock,
            SectionBlock,
            ImageBlock,
            DividerBlock,
          }}
        >
          <Frame data={parsedContent} />
        </Editor>
      );
    }
    
    // Fallback render HTML mentah jika bukan CraftJS
    return <div className="prose max-w-none warp-break-word overflow-hidden" dangerouslySetInnerHTML={{ __html: activeData.content }}></div>;
  };

  const renderForm = () => {
    if (activeData?.page_type !== "form" || !parsedFormSchema) return null;

    const fields = Array.isArray(parsedFormSchema.fields) ? parsedFormSchema.fields : [];
    if (fields.length === 0) return null;

    const submitLabel = parsedFormSchema.submitLabel || "Kirim";
    const formTitle = parsedFormSchema.title || "Formulir";
    const showList = parsedFormSchema.showList !== false;
    const allowPublic = parsedFormSchema.allowPublic !== false;

    const handleChange = (name) => (event) => {
      setFormValues((prev) => ({ ...prev, [name]: event.target.value }));
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      setFormMessage("");
      setFormSubmitting(true);

      try {
        const res = await fetch("/api/form_submissions.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_id: activeData.id,
            data: formValues,
          }),
        });
        const data = await safeJson(res);
        if (data.status === "success") {
          setFormMessage("Data berhasil dikirim.");
          setSubmissions((prev) => [
            {
              id: Date.now(),
              page_id: activeData.id,
              data: { ...formValues },
              created_at: new Date().toLocaleString("id-ID"),
            },
            ...prev,
          ]);
          const reset = {};
          fields.forEach((field) => {
            reset[field.name] = "";
          });
          setFormValues(reset);
        } else {
          setFormMessage(data.message || "Gagal mengirim data.");
        }
      } catch {
        setFormMessage("Koneksi server gagal.");
      } finally {
        setFormSubmitting(false);
      }
    };

    return (
      <div className="mt-10">
        {allowPublic && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{formTitle}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => {
                const fieldValue = formValues[field.name] ?? "";
                const commonProps = {
                  value: fieldValue,
                  onChange: handleChange(field.name),
                  required: Boolean(field.required),
                  className:
                    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-600",
                };

                const isFull = field.type === "textarea";

                return (
                  <div key={field.id || field.name} className={isFull ? "md:col-span-2" : ""}>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {field.type === "textarea" && (
                      <textarea rows="4" {...commonProps} />
                    )}
                    {field.type === "select" && (
                      <select {...commonProps}>
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
                    )}
                    {field.type !== "textarea" && field.type !== "select" && (
                      <input type={field.type || "text"} {...commonProps} />
                    )}
                  </div>
                );
              })}
              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center justify-center bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  {formSubmitting ? "Mengirim..." : submitLabel}
                </button>
                {formMessage && <span className="text-sm text-gray-600">{formMessage}</span>}
              </div>
            </form>
          </div>
        )}

        {showList && (
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Masuk</h3>
            {submissions.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada data.</div>
            ) : (
              <div className="overflow-x-auto text-sm">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {fields.map((field) => (
                        <th key={field.name} className="p-3 font-semibold text-gray-700">
                          {field.label}
                        </th>
                      ))}
                      <th className="p-3 font-semibold text-gray-700">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {submissions.map((entry) => (
                      <tr key={entry.id}>
                        {fields.map((field) => (
                          <td key={field.name} className="p-3 text-gray-600">
                            {entry.data?.[field.name] || "-"}
                          </td>
                        ))}
                        <td className="p-3 text-gray-500">{entry.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderModuleTable = () => {
    if (!activeData?.data_module_id || !moduleConfig) return null;
    const fields = Array.isArray(moduleConfig.fields) ? moduleConfig.fields : [];
    if (fields.length === 0) return null;

    const renderTable = (items) => (
      <div className="overflow-x-auto text-sm">
        <table className="w-full text-left">
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
                    {entry.data?.[field.name] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const renderCards = (isGrid, items) => {
      const cols = moduleConfig.grid_columns || 3;
      const gridClass =
        cols === 4
          ? "md:grid-cols-2 lg:grid-cols-4"
          : cols === 2
            ? "md:grid-cols-2"
            : "md:grid-cols-2 lg:grid-cols-3";

      return (
        <div className={`grid grid-cols-1 ${isGrid ? gridClass : "md:grid-cols-2"} gap-4 text-sm`}>
          {items.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            {fields.map((field) => (
              <div key={field.name} className="mb-2">
                <div className="text-[11px] uppercase text-gray-400 font-semibold">
                  {field.label}
                </div>
                <div className="text-gray-700">{entry.data?.[field.name] || "-"}</div>
              </div>
            ))}
          </div>
          ))}
        </div>
      );
    };

    const renderList = (items) => (
      <div className="space-y-4 text-sm">
        {items.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
            {fields.map((field) => (
              <div key={field.name} className="flex items-start gap-2 py-1">
                <div className="w-32 text-[11px] uppercase text-gray-400 font-semibold">
                  {field.label}
                </div>
                <div className="text-gray-700">{entry.data?.[field.name] || "-"}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );

    const displayType = moduleConfig.display_type || "table";
    const sortedEntries = moduleEntries;

    return (
      <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        {moduleEntries.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada data.</div>
        ) : displayType === "card" ? (
          renderCards(false, sortedEntries)
        ) : displayType === "grid" ? (
          renderCards(true, sortedEntries)
        ) : displayType === "list" ? (
          renderList(sortedEntries)
        ) : (
          renderTable(sortedEntries)
        )}

        {moduleTotal > MODULE_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{moduleTotal} data</span>
            <div className="flex gap-1">
              <button
                onClick={() => setModulePage((p) => Math.max(1, p - 1))}
                disabled={modulePage === 1}
                className="border px-2 py-1 rounded disabled:opacity-40"
              >
                {"<"}
              </button>
              {Array.from({ length: Math.ceil(moduleTotal / MODULE_PAGE_SIZE) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setModulePage(p)}
                  className={`border px-3 py-1 rounded ${p === modulePage ? "bg-gray-200 font-semibold" : ""}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setModulePage((p) => Math.min(Math.ceil(moduleTotal / MODULE_PAGE_SIZE), p + 1))}
                disabled={modulePage >= Math.ceil(moduleTotal / MODULE_PAGE_SIZE)}
                className="border px-2 py-1 rounded disabled:opacity-40"
              >
                {">"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!activeData) {
    if (slug === "default") {
      return (
        <main className="flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
          {renderComingSoon("Default")}
        </main>
      );
    }
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Laman tidak ditemukan atau belum diterbitkan.</h2>
        <button onClick={() => navigate('/')} className="text-(--primary) hover:underline">Kembali ke Beranda</button>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
      
      {activeData.template === 'blank' && (
        <div className="w-full">
          {renderContent()}
          {renderForm()}
          {renderModuleTable()}
        </div>
      )}
      
      
      {activeData.template === 'full-width' && (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 border-b-4 border-(--primary) inline-block pb-2">{decodedTitle}</h1>
          <div className="text-gray-600 leading-relaxed">
            {renderContent()}
          </div>
          {renderForm()}
          {renderModuleTable()}
        </div>
      )}

      {activeData.template === 'landing-modern' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-gray-600 leading-relaxed">
            {renderContent()}
          </div>
          {renderForm()}
        </div>
      )}

      {activeData.template === 'narrow' && (
        <div className="max-w-4xl mx-auto px-4 py-16">
          {activeData.breadcrumbs !== 'disable' && (
            <div className="flex justify-center items-center gap-2 text-sm text-gray-500 mb-4">
              <button onClick={() => navigate('/')} className="hover:text-(--primary) flex items-center gap-1"><Home className="w-4 h-4"/> Beranda</button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-(--body-text) font-medium">{decodedTitle}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800 mb-6 leading-tight">{decodedTitle}</h1>
        <div className="w-24 h-1 bg-(--primary) mx-auto mb-6 rounded-full"></div>
          <div className="text-(--body-text) leading-loose">
            {renderContent()}
          </div>
          {renderForm()}
          {renderModuleTable()}
        </div>
      )}

      {(!activeData.template || activeData.template === 'default') && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
          {activeData.breadcrumbs !== 'disable' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
              <button onClick={() => navigate('/')} className="hover:text-(--primary) flex items-center gap-1"><Home className="w-4 h-4"/> Beranda</button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-800 font-medium">{decodedTitle}</span>
            </div>
          )}
          <h1 className="text-4xl font-extrabold text-(--body-text) border-b-4 border-(--primary) inline-block pb-2 mb-6">{decodedTitle}</h1>
          
          <div className="text-(--body-text) leading-relaxed">
            {renderContent()}
          </div>
          {renderForm()}
          {renderModuleTable()}
        </div>
      )}

    </main>
  );
}




