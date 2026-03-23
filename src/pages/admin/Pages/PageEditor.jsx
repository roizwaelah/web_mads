
import React, { useState, useEffect } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Link as LinkIcon, 
  Save, 
  Type, 
  Square, 
  Users, 
  File,
  ChevronLeft,
  ChevronDown,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  MoveHorizontal,
  LayoutGrid,
  Image as ImageIcon,
  Minus
} from "lucide-react";
import { safeJson } from "../../../utils/http";
import { ContainerBlock } from "../../../components/blocks/ContainerBlock";
import { TextBlock } from "../../../components/blocks/TextBlock";
import { ButtonBlock } from "../../../components/blocks/ButtonBlock";
import { CardBlock } from "../../../components/blocks/CardBlock";
import { GuruBlock } from "../../../components/blocks/GuruBlock";
import { FilesBlock } from '../../../components/blocks/FilesBlock';
import { FacilityBlock } from '../../../components/blocks/FacilityBlock';
import { RichTextBlock } from "../../../components/blocks/RichTextBlock";
import { DataModuleBlock } from "../../../components/blocks/DataModuleBlock";
import { GapBlock } from "../../../components/blocks/GapBlock";
import { LayoutBlock } from "../../../components/blocks/LayoutBlock";
import { SectionBlock } from "../../../components/blocks/SectionBlock";
import { ImageBlock } from "../../../components/blocks/ImageBlock";
import { DividerBlock } from "../../../components/blocks/DividerBlock";

// --- KOMPONEN INTERNAL EDITOR ---

// 1. Toolbox Item (Elemen yang bisa di-drag)
const ToolboxItem = ({ icon, label, component }) => {
  const { connectors } = useEditor();
  return (
    <div 
      ref={(ref) => connectors.create(ref, component)}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-move hover:bg-blue-50 hover:border-blue-300 transition-all text-sm bg-white shadow-sm group"
    >
      <div className="text-gray-400 group-hover:text-blue-600">{icon}</div>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
  );
};

// 2. Settings Panel (Muncul saat elemen diklik)
const SettingsPanel = () => {
  const { selected, actions } = useEditor((state) => {
    const [currentNodeId] = state.events.selected;
    return {
      selected: currentNodeId
        ? {
            id: currentNodeId,
            name: state.nodes[currentNodeId].data.name,
            settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
          }
        : null,
    };
  });

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
      <div className="px-4 py-2 border-b bg-gray-50 font-semibold text-sm text-gray-800">
        Style Panel
      </div>
      <div className="p-4">
        {selected ? (
          <div className="space-y-4">
            <p className="text-xs font-bold text-blue-600 uppercase">Mengedit: {selected.name}</p>
            {selected.settings && React.createElement(selected.settings)}
            <button
              onClick={() => actions.delete(selected.id)}
              className="w-full mt-4 py-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 hover:bg-red-600 hover:text-white transition"
            >
              Hapus Elemen
            </button>
          </div>
        ) : (
          <p className="text-gray-400 text-xs italic">Klik elemen di kanvas untuk mengubah properti.</p>
        )}
      </div>
    </div>
  );
};

const LayersPanel = () => {
  const { nodes, selected, actions } = useEditor((state) => ({
    nodes: state.nodes,
    selected: state.events.selected,
  }));

  const rootId = "ROOT";

  const renderNode = (id, depth = 0) => {
    const node = nodes[id];
    if (!node) return null;
    const name = node.data.displayName || node.data.name || id;
    const selectedIds = selected ? Array.from(selected) : [];
    const isSelected = selectedIds.includes(id);
    const children = [
      ...(node.data.nodes || []),
      ...Object.values(node.data.linkedNodes || {}),
    ];

    return (
      <div key={id}>
        <button
          type="button"
          onClick={() => actions.selectNode(id)}
          className={`w-full text-left px-2 py-1 rounded text-xs transition ${isSelected ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
          style={{ paddingLeft: 8 + depth * 10 }}
        >
          {name}
        </button>
        {children.length > 0 && (
          <div className="mt-1">
            {children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
      <div className="px-4 py-2 border-b bg-gray-50 font-semibold text-sm text-gray-800">
        Layer Tree
      </div>
      <div className="p-2 max-h-64 overflow-auto">
        {renderNode(rootId)}
      </div>
    </div>
  );
};

const HistoryControls = () => {
  const { actions } = useEditor();
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => actions.history.undo()}
        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded hover:bg-gray-50"
      >
        <Undo2 className="w-4 h-4 "/>
      </button>
      <button
        type="button"
        onClick={() => actions.history.redo()}
        className="px-3 py-2 text-xs font-semibold border border-gray-200 rounded hover:bg-gray-50"
      >
        <Redo2 className="w-4 h-4 "/>
      </button>
    </div>
  );
};

// --- KOMPONEN UTAMA ---

const PageEditor = ({ navigate, showToast, pages, setPages, modules = [] }) => {
  const { id } = useParams();
  const routerNavigate = useNavigate();
  const goTo = typeof navigate === "function" ? navigate : routerNavigate;
  const editingPage = id ? pages.find((p) => p.id.toString() === id) : null;
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [initialContent, setInitialContent] = useState(null);
  const [contentError, setContentError] = useState(false);
  const [template, setTemplate] = useState("default");
  const [breadcrumbs, setBreadcrumbs] = useState("inherit");
  const [litespeed, setLitespeed] = useState(false);
  const [pageType, setPageType] = useState("static");
  const [dataModuleId, setDataModuleId] = useState("");
  const [formSchema, setFormSchema] = useState({
    title: "Formulir",
    submitLabel: "Kirim",
    showList: true,
    allowPublic: true,
    fields: [
      { id: "field-1", label: "Nama", name: "nama", type: "text", required: true, options: "" },
    ],
  });
  const [formEntries, setFormEntries] = useState([]);
  const [formEntryValues, setFormEntryValues] = useState({});
  const [formEntryMessage, setFormEntryMessage] = useState("");
  const [previewMode, setPreviewMode] = useState("desktop");
  const [toolboxSections, setToolboxSections] = useState({
    basic: true,
    dynamic: true,
  });

  const slugify = (value) =>
    (value || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

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

  // 1. Sinkronisasi State Dasar (Judul, Slug, dll)
  useEffect(() => {
    if (editingPage) {
      setTitle(decodeHtml(editingPage.title || ""));
      setSlug(editingPage.slug || "");
      setAuthor(editingPage.author || "Admin");
      setTemplate(editingPage.template || "default");
      setBreadcrumbs(editingPage.breadcrumbs || "inherit");
      setLitespeed(Boolean(editingPage.litespeed_cache ?? editingPage.litespeed));
      setPageType(editingPage.page_type === "form" ? "form" : "static");
      setDataModuleId(
        editingPage.data_module_id ? String(editingPage.data_module_id) : "",
      );
      if (editingPage.form_schema) {
        try {
          const parsed = typeof editingPage.form_schema === "string"
            ? JSON.parse(editingPage.form_schema)
            : editingPage.form_schema;
          if (parsed && typeof parsed === "object") {
            setFormSchema((prev) => ({
              ...prev,
              ...parsed,
              fields: Array.isArray(parsed.fields) && parsed.fields.length > 0
                ? parsed.fields
                : prev.fields,
            }));
          }
        } catch {
          // ignore invalid schema, keep default
        }
      }
    } else {
      setTitle("");
      setSlug("");
      setAuthor("Admin");
      setTemplate("default");
      setBreadcrumbs("inherit");
      setLitespeed(false);
      setPageType("static");
      setDataModuleId("");
    }
  }, [editingPage, id]);

  useEffect(() => {
    if (pageType !== "form" || !editingPage?.id) return;
    const controller = new AbortController();
    const loadEntries = async () => {
      try {
        const res = await fetch(
          `/api/form_submissions.php?page_id=${editingPage.id}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        if (data.status === "success") {
          setFormEntries(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadEntries();
    return () => controller.abort();
  }, [pageType, editingPage?.id]);

  useEffect(() => {
    if (pageType !== "form") return;
    const initial = {};
    formSchema.fields.forEach((field) => {
      initial[field.name] = "";
    });
    setFormEntryValues(initial);
  }, [pageType, formSchema.fields]);

  // 2. Parsing JSON secara aman + flag error
  useEffect(() => {
    if (!editingPage || !editingPage.content) {
      setInitialContent(null);
      setContentError(false);
      return;
    }

    try {
      const rawContent = editingPage.content;

      if (typeof rawContent !== "string") {
        setInitialContent(rawContent);
        setContentError(false);
        return;
      }

      const trimmed = rawContent.trim();
      if (!trimmed.startsWith("{")) {
        setInitialContent(null);
        setContentError(false);
        return;
      }

      JSON.parse(trimmed);
      setInitialContent(trimmed);
      setContentError(false);
    } catch (e) {
      console.error("Gagal parsing JSON konten:", e);
      setInitialContent(null);
      setContentError(true);
    }
  }, [editingPage]);

  useEffect(() => {
    if (contentError) {
      showToast?.("Konten laman tidak valid. Memuat kanvas kosong.");
    }
  }, [contentError, showToast]);

  // Fungsi Simpan Data
  const SaveButton = ({ title, slug, author, template, breadcrumbs, litespeed, pageType, formSchema, dataModuleId, editingPage, showToast, setPages }) => {
    const { query, state } = useEditor((editorState) => ({
      state: editorState,
    }));
    const [savedSnapshot, setSavedSnapshot] = useState("");
    const [isDirty, setIsDirty] = useState(false);

    const buildSnapshot = (contentJson) =>
      JSON.stringify({
        title,
        slug,
        author,
        template,
        breadcrumbs,
        litespeed: Boolean(litespeed),
        pageType,
        dataModuleId: dataModuleId || "",
        formSchema: pageType === "form" ? formSchema : null,
        content: contentJson || "",
      });

    useEffect(() => {
      const current = buildSnapshot(query.serialize());
      if (!savedSnapshot) {
        setSavedSnapshot(current);
        setIsDirty(false);
        return;
      }
      setIsDirty(current !== savedSnapshot);
    }, [
      state,
      title,
      slug,
      author,
      template,
      breadcrumbs,
      litespeed,
      pageType,
      dataModuleId,
      formSchema,
      savedSnapshot,
      query,
    ]);

    const handleSave = async () => {
      // Ambil JSON desain terbaru dari Craft.js
      const contentJson = query.serialize(); 
      
      const pageData = {
        id: editingPage?.id || null, // Jika null berarti tambah baru
        title,
        slug,
        author,
        content: contentJson,
        template,
        breadcrumbs,
        litespeed,
        status: "Publish",
        page_type: pageType,
        form_schema: pageType === "form" ? formSchema : null,
        data_module_id: dataModuleId ? Number(dataModuleId) : null,
      };

      try {
        const response = await fetch("/api/pages.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pageData),
        });
        const result = await safeJson(response).catch(() => ({}));
        if (response.ok && result.status === "success") {
          showToast?.("Laman berhasil disimpan!");
          if (typeof setPages === "function") {
            const resPages = await fetch("/api/pages.php");
            const dataPages = await safeJson(resPages).catch(() => ({}));
            if (dataPages.status === "success") setPages(dataPages.data);
          }
          const nextSnapshot = buildSnapshot(contentJson);
          setSavedSnapshot(nextSnapshot);
          setIsDirty(false);
          try {
            localStorage.setItem("pages-updated-at", String(Date.now()));
          } catch {
            // ignore
          }
          window.dispatchEvent(new Event("pages-updated"));
          return;
        }
        showToast?.(result.message || "Gagal menyimpan laman.");
      } catch (error) {
        showToast?.("Koneksi gagal.");
      }
    };

    return (
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded shadow transition ${
          isDirty
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        <Save className="w-4 h-4" /> Simpan
      </button>
    );
  };

  return (
    <div className="animate-fade-in pb-20 w-full max-w-none">
		  {/* HEADER BAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => goTo?.("/admin/pages")}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            {editingPage ? "Sunting Laman" : "Buat Laman Baru"}
          </h1>
        </div>
      </div>
    
      <Editor 
        key={`${editingPage?.id || "new-page"}-${initialContent ? "loaded" : "empty"}`} 
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
        {/* TOOLBAR ATAS */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Slug URL</label>
                <div className="flex items-center gap-2 border-b border-gray-200 py-1">
                  <LinkIcon className="w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="text-xs w-full focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Penulis</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Template</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
                >
                  <option value="default">Default</option>
                  <option value="full-width">Full Width</option>
                  <option value="landing-modern">Landing Modern</option>
                  <option value="narrow">Narrow</option>
                  <option value="blank">Blank</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tipe Laman</label>
                <select
                  value={pageType}
                  onChange={(e) => setPageType(e.target.value)}
                  className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
                >
                  <option value="static">Statis</option>
                  <option value="form">Form</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase">Breadcrumb</label>
                <select
                  value={breadcrumbs}
                  onChange={(e) => setBreadcrumbs(e.target.value)}
                  className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
                >
                  <option value="inherit">Inherit</option>
                  <option value="enable">Enable</option>
                  <option value="disable">Disable</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={litespeed}
                  onChange={(e) => setLitespeed(e.target.checked)}
                  className="h-4 w-4"
                />
                LiteSpeed Cache
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`px-3 py-2 text-xs font-semibold border rounded ${previewMode === "desktop" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <Monitor className="w-4 h-4"/>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`px-3 py-2 text-xs font-semibold border rounded ${previewMode === "mobile" ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  <Smartphone className="w-4 h-4"/>
                </button>
              </div>
              <HistoryControls />
              <SaveButton
                title={title}
                slug={slug}
                author={author}
                template={template}
                breadcrumbs={breadcrumbs}
                litespeed={litespeed}
                pageType={pageType}
                formSchema={formSchema}
                dataModuleId={dataModuleId}
                editingPage={editingPage}
                showToast={showToast}
                setPages={setPages}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* PANEL KIRI: TOOLBOX */}
          <div className="w-full lg:w-64 space-y-6 order-2 lg:order-1">
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-4">
              <button
                type="button"
                onClick={() => setToolboxSections((prev) => ({ ...prev, basic: !prev.basic }))}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider"
              >
                Elemen Dasar
                <span className="text-gray-600 text-xs">
                  {toolboxSections.basic ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {toolboxSections.basic && (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <ToolboxItem icon={<Type size={18}/>} label="Teks" component={<TextBlock text="Teks baru di sini..." />} />
                  <ToolboxItem icon={<Type size={18}/>} label="Text Editor" component={<RichTextBlock />} />
                  <ToolboxItem icon={<Square size={18}/>} label="Kontainer" component={<Element is={ContainerBlock} padding="p-6" canvas />} />
                  <ToolboxItem icon={<Square size={18}/>} label="Section" component={<Element is={SectionBlock} canvas />} />
                  <ToolboxItem icon={<Square size={18}/>} label="Card" component={<CardBlock />} />
                  <ToolboxItem icon={<ImageIcon size={18}/>} label="Gambar" component={<ImageBlock />} />
                  <ToolboxItem icon={<Minus size={18}/>} label="Divider" component={<DividerBlock />} />
                  <ToolboxItem icon={<Square size={18}/>} label="Button" component={<ButtonBlock />} />
                  <ToolboxItem icon={<LayoutGrid size={18}/>} label="Layout Grid/Flex" component={<Element is={LayoutBlock} canvas />} />
                  <ToolboxItem icon={<MoveHorizontal size={18}/>} label="Gap" component={<GapBlock />} />
                </div>
              )}

              <button
                type="button"
                onClick={() => setToolboxSections((prev) => ({ ...prev, dynamic: !prev.dynamic }))}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mt-8"
              >
                Blok Dinamis
                <span className="text-gray-600 text-xs">
                  {toolboxSections.dynamic ? <ChevronDown className="w-4 h-4 rotate-180" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {toolboxSections.dynamic && (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  <ToolboxItem icon={<Users size={18}/>} label="Daftar Guru" component={<GuruBlock />} />
                  <ToolboxItem icon={<File size={18}/>} label="Daftar File" component={<FilesBlock />} />
                  <ToolboxItem icon={<File size={18}/>} label="Daftar Fasilitas" component={<FacilityBlock />} />
                  <ToolboxItem icon={<File size={18}/>} label="Data Module" component={<DataModuleBlock />} />
                </div>
              )}
            </div>

            <LayersPanel />
            <SettingsPanel />
          </div>

          {/* AREA KANVAS */}
          <div className="flex-1 space-y-4">
            <input
              type="text"
              placeholder="Masukkan Judul Laman..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent border-b-2 border-gray-200 px-1 py-2 text-3xl font-bold focus:outline-none focus:border-blue-500"
            />

            {pageType === "form" && (
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Form Builder</div>
                    <div className="text-xs text-gray-500">
                      Atur field yang akan diisi pengunjung. Data akan tersimpan otomatis.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormSchema((prev) => ({
                        ...prev,
                        fields: [
                          ...prev.fields,
                          {
                            id: `field-${Date.now()}`,
                            label: "Field Baru",
                            name: `field_${prev.fields.length + 1}`,
                            type: "text",
                            required: false,
                            options: "",
                          },
                        ],
                      }))
                    }
                    className="text-xs border border-gray-300 px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                  >
                    + Tambah Field
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="text-[11px] text-gray-500">Judul Form</label>
                    <input
                      type="text"
                      value={formSchema.title}
                      onChange={(e) =>
                        setFormSchema((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500">Label Tombol</label>
                    <input
                      type="text"
                      value={formSchema.submitLabel}
                      onChange={(e) =>
                        setFormSchema((prev) => ({ ...prev, submitLabel: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      checked={formSchema.showList}
                      onChange={(e) =>
                        setFormSchema((prev) => ({ ...prev, showList: e.target.checked }))
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-600">Tampilkan data masuk</span>
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      checked={formSchema.allowPublic}
                      onChange={(e) =>
                        setFormSchema((prev) => ({ ...prev, allowPublic: e.target.checked }))
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-600">Izinkan input publik</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {formSchema.fields.map((field, idx) => (
                    <div key={field.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">
                          Field #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormSchema((prev) => ({
                              ...prev,
                              fields: prev.fields.filter((f) => f.id !== field.id),
                            }))
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
                            setFormSchema((prev) => ({
                              ...prev,
                              fields: prev.fields.map((f) =>
                                f.id === field.id
                                  ? {
                                      ...f,
                                      label: e.target.value,
                                      name: f.name || slugify(e.target.value),
                                    }
                                  : f,
                              ),
                            }))
                          }
                          className="border border-gray-200 rounded px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Nama (key)"
                          value={field.name}
                          onChange={(e) =>
                            setFormSchema((prev) => ({
                              ...prev,
                              fields: prev.fields.map((f) =>
                                f.id === field.id ? { ...f, name: e.target.value } : f,
                              ),
                            }))
                          }
                          className="border border-gray-200 rounded px-3 py-2 text-sm"
                        />
                        <select
                          value={field.type}
                          onChange={(e) =>
                            setFormSchema((prev) => ({
                              ...prev,
                              fields: prev.fields.map((f) =>
                                f.id === field.id ? { ...f, type: e.target.value } : f,
                              ),
                            }))
                          }
                          className="border border-gray-200 rounded px-3 py-2 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="email">Email</option>
                          <option value="number">Number</option>
                          <option value="tel">Telepon</option>
                          <option value="date">Tanggal</option>
                          <option value="select">Select</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              setFormSchema((prev) => ({
                                ...prev,
                                fields: prev.fields.map((f) =>
                                  f.id === field.id
                                    ? { ...f, required: e.target.checked }
                                    : f,
                                ),
                              }))
                            }
                          />
                          Wajib
                        </label>
                      </div>
                      {field.type === "select" && (
                        <input
                          type="text"
                          placeholder="Opsi dipisah koma (contoh: IPA, IPS)"
                          value={field.options || ""}
                          onChange={(e) =>
                            setFormSchema((prev) => ({
                              ...prev,
                              fields: prev.fields.map((f) =>
                                f.id === field.id ? { ...f, options: e.target.value } : f,
                              ),
                            }))
                          }
                          className="border border-gray-200 rounded px-3 py-2 text-sm mt-3 w-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pageType === "form" && (
              <div className="bg-white border border-gray-200 rounded-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Input Data (Admin)</div>
                    <div className="text-xs text-gray-500">
                      Data yang diinput di sini langsung tampil di halaman publik.
                    </div>
                  </div>
                </div>

                {!editingPage?.id ? (
                  <div className="text-sm text-gray-500">
                    Simpan laman terlebih dahulu untuk mulai menambahkan data.
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        setFormEntryMessage("");
                        try {
                          const res = await fetch("/api/form_submissions.php", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              page_id: editingPage.id,
                              data: formEntryValues,
                            }),
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            setFormEntryMessage("Data berhasil ditambahkan.");
                            setFormEntries((prev) => [
                              {
                                id: Date.now(),
                                page_id: editingPage.id,
                                data: { ...formEntryValues },
                                created_at: new Date().toLocaleString("id-ID"),
                              },
                              ...prev,
                            ]);
                            const reset = {};
                            formSchema.fields.forEach((field) => {
                              reset[field.name] = "";
                            });
                            setFormEntryValues(reset);
                          } else {
                            setFormEntryMessage(data.message || "Gagal menambahkan data.");
                          }
                        } catch {
                          setFormEntryMessage("Koneksi server gagal.");
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      {formSchema.fields.map((field) => (
                        <div key={field.id || field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                          <label className="text-xs text-gray-600 mb-1 block">
                            {field.label}
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              rows="3"
                              value={formEntryValues[field.name] || ""}
                              onChange={(e) =>
                                setFormEntryValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                            />
                          ) : field.type === "select" ? (
                            <select
                              value={formEntryValues[field.name] || ""}
                              onChange={(e) =>
                                setFormEntryValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
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
                          ) : (
                            <input
                              type={field.type || "text"}
                              value={formEntryValues[field.name] || ""}
                              onChange={(e) =>
                                setFormEntryValues((prev) => ({
                                  ...prev,
                                  [field.name]: e.target.value,
                                }))
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
                          Tambah Data
                        </button>
                        {formEntryMessage && (
                          <span className="text-sm text-gray-500">{formEntryMessage}</span>
                        )}
                      </div>
                    </form>

                    <div className="mt-6">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Data Masuk</div>
                      {formEntries.length === 0 ? (
                        <div className="text-sm text-gray-500">Belum ada data.</div>
                      ) : (
                        <div className="overflow-x-auto text-sm">
                          <table className="w-full text-left border border-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                {formSchema.fields.map((field) => (
                                  <th key={field.name} className="p-2 font-semibold text-gray-600">
                                    {field.label}
                                  </th>
                                ))}
                                <th className="p-2 font-semibold text-gray-600 w-32">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {formEntries.map((entry) => (
                                <tr key={entry.id}>
                                  {formSchema.fields.map((field) => (
                                    <td key={field.name} className="p-2 text-gray-600">
                                      {entry.data?.[field.name] || "-"}
                                    </td>
                                  ))}
                                  <td className="p-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(
                                            `/api/form_submissions.php?id=${entry.id}`,
                                            { method: "DELETE" },
                                          );
                                          const data = await res.json();
                                          if (data.status === "success") {
                                            setFormEntries((prev) =>
                                              prev.filter((row) => row.id !== entry.id),
                                            );
                                          }
                                        } catch {
                                          // ignore
                                        }
                                      }}
                                      className="text-xs text-red-600 hover:underline"
                                    >
                                      Hapus
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-4">
              <div className="mx-auto w-full">
                <div
                  className={`mx-auto ${previewMode === "desktop" ? "max-w-none" : previewMode === "tablet" ? "max-w-[980px]" : "max-w-[420px]"}`}
                >
                  <div className="bg-white border border-gray-300 shadow-xl min-h-[800px] rounded-sm overflow-hidden">
                    <Frame key={`${editingPage?.id || "new"}-${initialContent ? "loaded" : "empty"}`} data={initialContent}>
                      <Element is={ContainerBlock} padding="p-10" background="bg-white" canvas>
                        <TextBlock text="Mulai desain laman Anda..." fontSize="text-2xl" color="text-gray-400" />
                      </Element>
                    </Frame>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Editor>
    </div>
  );
};

export default PageEditor;

