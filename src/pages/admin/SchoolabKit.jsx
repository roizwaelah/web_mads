import React, { useState, useEffect } from "react";
import {
  Wand2,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Image as ImageIcon,
  Plus,
  Trash2,
  LayoutTemplate,
} from "lucide-react";
import MediaModal from "../../components/ui/MediaModal";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { safeJson } from "../../utils/http";

// Fallback Settings agar form tidak crash jika themeSettings belum ada nilainya
const defaultSettings = {
  logoUrl: "",
  faviconUrl: "",
  sambutanKepala: "",
  sambutanLinkSlug: "",
  sambutanFoto: "",
  headerStyle: "classic",
  stickyHeader: true,
  navigationMenu: [],
  sliders: [],
  phone: "",
  email: "",
  address: "",
  social: { facebook: "", twitter: "", instagram: "", youtube: "" },
  primaryColor: "#006b37",
  accentColor: "#ffcb0f",
  bodyColor: "#000000",
  bgColor: "#ededed",
  fontFamily: "Abel",
  fontSize: "16px",
  schoolName: "",
  schoolDescription: "",
};

const SchoolabKit = ({
  showToast,
  themeSettings,
  setThemeSettings,
  mediaItems,
  pages,
}) => {
  const [activeTab, setActiveTab] = useState("umum");
  // Gabungkan defaultSettings dengan data asli dari database
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(themeSettings || {}),
  });

  // State untuk mengontrol Modal Media
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState(null);

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

  useEffect(() => {
    if (themeSettings) {
      setFormData({ ...defaultSettings, ...themeSettings });
    }
  }, [themeSettings]);

  const tabs = [
    { id: "umum", label: "Pengaturan Umum" },
    { id: "header", label: "Header & Footer" },
    { id: "menu", label: "Navigasi Menu" },
    { id: "kontak", label: "Kontak & Alamat" },
    { id: "sosmed", label: "Sosial Media" },
    { id: "slider", label: "Home Slider" },
    { id: "warna", label: "Warna Tema" },
    { id: "tipografi", label: "Tipografi" },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      social: { ...(prev.social || {}), [name]: value },
    }));
  };

  const handleSliderChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sliders: (prev.sliders || []).map((slide) =>
        slide.id === id ? { ...slide, [field]: value } : slide,
      ),
    }));
  };

  const addSlider = () => {
    setFormData((prev) => ({
      ...prev,
      sliders: [
        ...(prev.sliders || []),
        {
          id: Date.now(),
          image: "",
          title: "Judul Baru",
          subtitle: "Subjudul baru",
        },
      ],
    }));
  };

  const removeSlider = (id) => {
    setFormData((prev) => ({
      ...prev,
      sliders: prev.sliders.filter((slide) => slide.id !== id),
    }));
  };

  const openMediaSelector = (target) => {
    setActiveMediaTarget(target);
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (media) => {
    if (media.type !== "image") {
      showToast?.("Harap pilih berkas gambar (JPG/PNG)!", "error");
      return;
    }

    if (activeMediaTarget === "logo") {
      setFormData((prev) => ({ ...prev, logoUrl: media.url }));
    } else if (activeMediaTarget === "favicon") {
      setFormData((prev) => ({ ...prev, faviconUrl: media.url }));
    } else if (activeMediaTarget === "sambutanFoto") {
      setFormData((prev) => ({ ...prev, sambutanFoto: media.url }));
    } else if (activeMediaTarget?.type === "slider") {
      handleSliderChange(activeMediaTarget.id, "image", media.url);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    showToast?.("Menyimpan pengaturan...", "info");
    try {
      const response = await fetch("/api/settings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await safeJson(response);
      if (result.status === "success") {
        setThemeSettings(formData);
        showToast?.(
          "Pengaturan TemplateKit berhasil disimpan ke Database!",
          "success",
        );
      } else {
        showToast?.(`Gagal: ${result.message}`, "error");
      }
    } catch (error) {
      showToast?.("Terjadi kesalahan koneksi ke server.", "error");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <Wand2 className="text-yellow-500 w-6 h-6" />
        <h1 className="text-2xl font-normal text-gray-800">
          Pengaturan TemplateKit
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 shrink-0">
          <ul className="bg-white border border-gray-200 shadow-sm rounded-md text-sm overflow-hidden divide-y divide-gray-100">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 transition font-medium ${activeTab === tab.id ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : "hover:bg-gray-50 text-gray-600 border-l-4 border-transparent"}`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* FORM CONTENT */}
        <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded-md overflow-hidden text-sm w-full">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
          </div>

          <form onSubmit={handleSave}>
            <div className="p-6 min-h-[400px]">
              {/* TAB UMUM (Sambutan Kepala) */}
              {activeTab === "umum" && (
                <div className="space-y-8 animate-fade-in max-w-2xl">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-3">
                      Sambutan Kepala Madrasah
                    </label>
                    <div className="bg-white border border-gray-300 rounded-md shadow-sm">
                      <style>{`
                        .sambutan-editor .ql-container { min-height: 220px; font-size: 14px; font-family: inherit; }
                        .sambutan-editor .ql-toolbar { border-top: none; border-left: none; border-right: none; background-color: #f9fafb; }
                        .sambutan-editor .ql-container.ql-snow { border: none; }
                      `}</style>
                      <ReactQuill
                        theme="snow"
                        value={formData.sambutanKepala || ""}
                        onChange={(value) =>
                          setFormData({ ...formData, sambutanKepala: value })
                        }
                        className="sambutan-editor"
                        placeholder="Tulis cuplikan sambutan kepala madrasah untuk ditampilkan di bagian statistik beranda."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-3">
                      Foto Kepala Madrasah
                    </label>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 border border-gray-200 rounded-md">
                      <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                        {formData.sambutanFoto ? (
                          <img
                            src={formData.sambutanFoto}
                            alt="Foto Kepala Madrasah"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="text-gray-300 w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => openMediaSelector("sambutanFoto")}
                          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
                        >
                          Pilih Foto
                        </button>
                        {formData.sambutanFoto && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                sambutanFoto: "",
                              }))
                            }
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                          >
                            Hapus Foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-3">
                      Link Tombol "Selengkapnya"
                    </label>
                    <select
                      value={formData.sambutanLinkSlug || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, sambutanLinkSlug: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-md p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Laman --</option>
                      {pages?.map((p) => (
                        <option key={p.id} value={p.slug}>
                          {decodeHtml(p.title)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB HEADER & NAVIGASI */}
              {activeTab === "header" && (
                <div className="space-y-6 animate-fade-in max-w-2xl">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-3">
                      Logo Madrasah
                    </label>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gray-50 p-4 border border-gray-200 rounded-md">
                      <div className="w-24 h-24 bg-white rounded-md shadow-sm border border-gray-200 p-2 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.logoUrl ? (
                          <img
                            src={formData.logoUrl}
                            alt="Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="text-gray-300 w-10 h-10" />
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                        <p className="text-xs text-gray-500">
                          Gunakan gambar resolusi tinggi dengan background
                          transparan (PNG). Ukuran disarankan: 200x200 px.
                        </p>
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={() => openMediaSelector("logo")}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
                          >
                            Pilih dari Media
                          </button>
                          {formData.logoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  logoUrl: "",
                                }))
                              }
                              className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-3">
                      Ikon Situs (Favicon)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gray-50 p-4 border border-gray-200 rounded-md">
                      <div className="w-16 h-16 bg-white rounded-md shadow-sm border border-gray-200 p-2 flex items-center justify-center overflow-hidden shrink-0">
                        {formData.faviconUrl ? (
                          <img
                            src={formData.faviconUrl}
                            alt="Favicon"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <LayoutTemplate className="text-gray-300 w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1 w-full space-y-3 text-center sm:text-left">
                        <p className="text-xs text-gray-500">
                          Ikon situs muncul di tab browser pengguna dan
                          bookmark. Bentuk harus persegi, disarankan 512x512 px.
                        </p>
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            onClick={() => openMediaSelector("favicon")}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
                          >
                            Pilih dari Media
                          </button>
                          {formData.faviconUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  faviconUrl: "",
                                }))
                              }
                              className="text-red-500 hover:text-red-700 text-xs font-medium px-2"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-2">
                      Gaya Header (Navigasi)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                      <label
                        className={`border-2 rounded-lg p-4 cursor-pointer transition text-center ${formData.headerStyle === "classic" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <input
                          type="radio"
                          name="headerStyle"
                          value="classic"
                          checked={formData.headerStyle === "classic"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="h-12 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-between px-2 mb-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <div className="flex gap-1">
                            <div className="w-6 h-1.5 bg-gray-200 rounded"></div>
                            <div className="w-6 h-1.5 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700 text-xs block">
                          Gaya 1 - Klasik
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Logo Kiri, Menu Kanan
                        </span>
                      </label>

                      <label
                        className={`border-2 rounded-lg p-4 cursor-pointer transition text-center ${formData.headerStyle === "centered" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <input
                          type="radio"
                          name="headerStyle"
                          value="centered"
                          checked={formData.headerStyle === "centered"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="h-12 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-1.5 mb-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <div className="flex gap-1">
                            <div className="w-6 h-1 bg-gray-200 rounded"></div>
                            <div className="w-6 h-1 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700 text-xs block">
                          Gaya 2 - Terpusat
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Logo Tengah, Menu Bawah
                        </span>
                      </label>

                      <label
                        className={`border-2 rounded-lg p-4 cursor-pointer transition text-center ${formData.headerStyle === "hamburger" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                      >
                        <input
                          type="radio"
                          name="headerStyle"
                          value="hamburger"
                          checked={formData.headerStyle === "hamburger"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <div className="h-12 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-between px-2 mb-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                          <div className="space-y-0.5">
                            <div className="w-4 h-0.5 bg-gray-400"></div>
                            <div className="w-4 h-0.5 bg-gray-400"></div>
                            <div className="w-4 h-0.5 bg-gray-400"></div>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-700 text-xs block">
                          Gaya 3 - Tersembunyi
                        </span>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Menggunakan Hamburger Menu
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="stickyHeader"
                        checked={formData.stickyHeader}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-800 block">
                          Lengket di Atas (Sticky Header)
                        </span>
                        <span className="text-xs text-gray-500">
                          Header akan terus mengikuti layar saat pengunjung
                          menggulir halaman ke bawah.
                        </span>
                      </div>
                    </label>
                  </div>
                  <div>
                    <h3 className="block font-semibold text-gray-800 mb-2">Identitas Situs</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Lembaga / Sekolah
                        </label>
                        <input
                          type="text"
                          value={formData.schoolName || ""}
                          onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                          placeholder="Contoh: MA Darussalam Cilongok"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="block font-semibold text-(--primary) mb-2">Konten Footer</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Singkat Lembaga</label>
                        <textarea
                          value={formData.schoolDescription || ""}
                          onChange={(e) => setFormData({ ...formData, schoolDescription: e.target.value })}
                          placeholder="Masukkan deskripsi yang akan muncul di footer..."
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB MENU NAVIGASI */}
              {activeTab === "menu" && (
                <div className="space-y-6 animate-fade-in max-w-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-500 text-xs">
                      Atur tautan menu yang muncul di bagian atas (Header)
                      website Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          navigationMenu: [
                            ...(prev.navigationMenu || []),
                            {
                              id: Date.now(),
                              label: "Menu Baru",
                              type: "page",
                              slug: "",
                            },
                          ],
                        }))
                      }
                      className="bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Menu Utama
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(formData.navigationMenu || []).map((item, index) => (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-md p-4 bg-gray-50 relative group"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              navigationMenu: prev.navigationMenu.filter(
                                (m) => m.id !== item.id,
                              ),
                            }))
                          }
                          className="absolute top-2 right-2 p-1.5 bg-white text-red-500 border border-red-200 rounded hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col sm:flex-row gap-4 mb-2">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Label / Nama Menu
                            </label>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const newMenu = [...formData.navigationMenu];
                                newMenu[index] = {
                                  ...newMenu[index],
                                  label: e.target.value,
                                };
                                setFormData({
                                  ...formData,
                                  navigationMenu: newMenu,
                                });
                              }}
                              className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="w-full sm:w-1/3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Tipe Tautan
                            </label>
                            <select
                              value={item.type}
                              onChange={(e) => {
                                const newMenu = [...formData.navigationMenu];
                                newMenu[index] = {
                                  ...newMenu[index],
                                  type: e.target.value,
                                };
                                if (
                                  e.target.value === "dropdown" &&
                                  !newMenu[index].children
                                )
                                  newMenu[index].children = [];
                                setFormData({
                                  ...formData,
                                  navigationMenu: newMenu,
                                });
                              }}
                              className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500 bg-white"
                            >
                              <option value="home">Menuju Beranda</option>
                              <option value="articles">Daftar Artikel</option>
                              <option value="agenda">
                                Daftar Agenda
                              </option>
                              <option value="announcements">
                                Daftar Pengumuman
                              </option>
                              <option value="default">
                                Default (Coming Soon)
                              </option>
                              <option value="ekskul">Ekstrakulikuler</option>
                              <option value="page">Laman Statis</option>
                              <option value="custom">Tautan Custom URL</option>
                              <option value="dropdown">
                                Dropdown (Sub-Menu)
                              </option>
                            </select>
                          </div>

                          <div className="w-full sm:w-1/3">
                            {item.type === "page" && (
                              <>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Pilih Laman Target
                                </label>
                                <select
                                  value={item.slug || ""}
                                  onChange={(e) => {
                                    const newMenu = [
                                      ...formData.navigationMenu,
                                    ];
                                    newMenu[index] = {
                                      ...newMenu[index],
                                      slug: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      navigationMenu: newMenu,
                                    });
                                  }}
                                  className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500 bg-white"
                                >
                                  <option value="">-- Pilih Laman --</option>
                                  {pages?.map((p) => (
                                    <option key={p.id} value={p.slug}>
                                      {p.title}
                                    </option>
                                  ))}
                                </select>
                              </>
                            )}
                            {item.type === "custom" && (
                              <>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  URL / Link Target
                                </label>
                                <input
                                  type="text"
                                  value={item.url || ""}
                                  onChange={(e) => {
                                    const newMenu = [
                                      ...formData.navigationMenu,
                                    ];
                                    newMenu[index] = {
                                      ...newMenu[index],
                                      url: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      navigationMenu: newMenu,
                                    });
                                  }}
                                  className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500"
                                  placeholder="https://..."
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* RENDER SUB-MENU JIKA TIPENYA DROPDOWN */}
                        {item.type === "dropdown" && (
                          <div className="mt-4 pl-6 border-l-2 border-blue-200 space-y-3">
                            <p className="text-xs font-semibold text-gray-600 mb-2">
                              Item Sub-Menu:
                            </p>
                            {item.children?.map((child, cIndex) => (
                              <div
                                key={child.id}
                                className="flex gap-3 items-end bg-white p-3 border border-gray-200 rounded"
                              >
                                <div className="flex-1">
                                  <label className="block text-[10px] text-gray-500 mb-1">
                                    Label Sub-Menu
                                  </label>
                                  <input
                                    type="text"
                                    value={child.label}
                                    onChange={(e) => {
                                      const newMenu = [
                                        ...formData.navigationMenu,
                                      ];
                                      const newChildren = [
                                        ...newMenu[index].children,
                                      ];
                                      newChildren[cIndex] = {
                                        ...newChildren[cIndex],
                                        label: e.target.value,
                                      };
                                      newMenu[index] = {
                                        ...newMenu[index],
                                        children: newChildren,
                                      };
                                      setFormData({
                                        ...formData,
                                        navigationMenu: newMenu,
                                      });
                                    }}
                                    className="w-full border border-gray-300 p-1.5 text-xs rounded focus:outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[10px] text-gray-500 mb-1">
                                    Tipe Tautan
                                  </label>
                                  <select
                                    value={child.type || "page"}
                                    onChange={(e) => {
                                      const newMenu = [
                                        ...formData.navigationMenu,
                                      ];
                                      const newChildren = [
                                        ...newMenu[index].children,
                                      ];
                                      newChildren[cIndex] = {
                                        ...newChildren[cIndex],
                                        type: e.target.value,
                                      };
                                      newMenu[index] = {
                                        ...newMenu[index],
                                        children: newChildren,
                                      };
                                      setFormData({
                                        ...formData,
                                        navigationMenu: newMenu,
                                      });
                                    }}
                                    className="w-full border border-gray-300 p-1.5 text-xs rounded focus:outline-none focus:border-blue-500 bg-white"
                                  >
                                    <option value="page">Laman</option>
                                    <option value="custom">Custom URL</option>
                                    <option value="default">
                                      Default (Coming Soon)
                                    </option>
                                  </select>
                                </div>
                                <div className="flex-1">
                                  { (child.type || "page") === "page" ? (
                                    <>
                                      <label className="block text-[10px] text-gray-500 mb-1">
                                        Pilih Laman
                                      </label>
                                      <select
                                        value={child.slug || ""}
                                        onChange={(e) => {
                                          const newMenu = [
                                            ...formData.navigationMenu,
                                          ];
                                          const newChildren = [
                                            ...newMenu[index].children,
                                          ];
                                          newChildren[cIndex] = {
                                            ...newChildren[cIndex],
                                            slug: e.target.value,
                                          };
                                          newMenu[index] = {
                                            ...newMenu[index],
                                            children: newChildren,
                                          };
                                          setFormData({
                                            ...formData,
                                            navigationMenu: newMenu,
                                          });
                                        }}
                                        className="w-full border border-gray-300 p-1.5 text-xs rounded focus:outline-none focus:border-blue-500 bg-white"
                                      >
                                        <option value="">-- Pilih Laman --</option>
                                        {pages?.map((p) => (
                                          <option key={p.id} value={p.slug}>
                                            {p.title}
                                          </option>
                                        ))}
                                      </select>
                                    </>
                                  ) : (
                                    <>
                                      <label className="block text-[10px] text-gray-500 mb-1">
                                        URL Target
                                      </label>
                                      <input
                                        type="text"
                                        value={child.url || ""}
                                        onChange={(e) => {
                                          const newMenu = [
                                            ...formData.navigationMenu,
                                          ];
                                          const newChildren = [
                                            ...newMenu[index].children,
                                          ];
                                          newChildren[cIndex] = {
                                            ...newChildren[cIndex],
                                            url: e.target.value,
                                          };
                                          newMenu[index] = {
                                            ...newMenu[index],
                                            children: newChildren,
                                          };
                                          setFormData({
                                            ...formData,
                                            navigationMenu: newMenu,
                                          });
                                        }}
                                        className="w-full border border-gray-300 p-1.5 text-xs rounded focus:outline-none focus:border-blue-500"
                                        placeholder="https://..."
                                      />
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newMenu = [
                                      ...formData.navigationMenu,
                                    ];
                                    newMenu[index] = {
                                      ...newMenu[index],
                                      children: newMenu[index].children.filter(
                                        (c) => c.id !== child.id,
                                      ),
                                    };
                                    setFormData({
                                      ...formData,
                                      navigationMenu: newMenu,
                                    });
                                  }}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newMenu = [...formData.navigationMenu];
                                newMenu[index] = {
                                  ...newMenu[index],
                                  children: [
                                    ...(newMenu[index].children || []),
                                    {
                                      id: Date.now(),
                                      label: "Sub Menu Baru",
                                      type: "page",
                                      slug: "",
                                      url: "",
                                    },
                                  ],
                                };
                                setFormData({
                                  ...formData,
                                  navigationMenu: newMenu,
                                });
                              }}
                              className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-block"
                            >
                              + Tambah Item Sub-Menu
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!formData.navigationMenu ||
                      formData.navigationMenu.length === 0) && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-md text-gray-500 bg-gray-50">
                        Belum ada menu navigasi. Klik "Tambah Menu Utama" untuk
                        memulai.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB KONTAK */}
              {activeTab === "kontak" && (
                <div className="space-y-6 animate-fade-in max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1.5 text-xs">
                        No. Telepon / WhatsApp
                      </label>
                      <div className="flex items-center shadow-sm">
                        <span className="bg-gray-50 border border-gray-300 p-2 px-3 rounded-l-md text-gray-500">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleChange}
                          className="flex-1 border-y border-r border-gray-300 p-2 rounded-r-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1.5 text-xs">
                        Alamat Email
                      </label>
                      <div className="flex items-center shadow-sm">
                        <span className="bg-gray-50 border border-gray-300 p-2 px-3 rounded-l-md text-gray-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ""}
                          onChange={handleChange}
                          className="flex-1 border-y border-r border-gray-300 p-2 rounded-r-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1.5 text-xs">
                      Alamat Lengkap Madrasah
                    </label>
                    <div className="flex items-start shadow-sm">
                      <span className="bg-gray-50 border border-gray-300 p-2 px-3 rounded-l-md h-[74px] text-gray-500">
                        <MapPin className="w-4 h-4 mt-1" />
                      </span>
                      <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        rows="2"
                        className="flex-1 border-y border-r border-gray-300 p-2 rounded-r-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB SOSMED */}
              {activeTab === "sosmed" && (
                <div className="space-y-4 animate-fade-in max-w-2xl">
                  <p className="text-gray-500 text-xs mb-4">
                    Kosongkan kolom URL jika Anda tidak ingin memunculkan ikon
                    sosial media tersebut di website.
                  </p>
                  {["facebook", "instagram", "youtube", "twitter"].map(
                    (net) => (
                      <div key={net}>
                        <label className="block font-semibold text-gray-700 mb-1.5 text-xs capitalize">
                          {net} URL
                        </label>
                        <div className="flex items-center shadow-sm">
                          <span className="bg-gray-50 border border-gray-300 p-2 px-3 rounded-l-md text-gray-500 w-12 flex justify-center">
                            {net === "facebook" && (
                              <Facebook className="w-4 h-4 text-blue-600" />
                            )}
                            {net === "instagram" && (
                              <Instagram className="w-4 h-4 text-pink-600" />
                            )}
                            {net === "youtube" && (
                              <Youtube className="w-4 h-4 text-red-600" />
                            )}
                            {net === "twitter" && (
                              <Twitter className="w-4 h-4 text-gray-800" />
                            )}
                          </span>
                          <input
                            type="text"
                            name={net}
                            value={formData.social?.[net] || ""}
                            onChange={handleSocialChange}
                            className="flex-1 border-y border-r border-gray-300 p-2 rounded-r-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-300"
                            placeholder={`https://${net}.com/...`}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* TAB HOME SLIDER */}
              {activeTab === "slider" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-500 text-xs">
                      Atur gambar dan teks yang muncul di bagian atas Beranda.
                    </p>
                    <button
                      type="button"
                      onClick={addSlider}
                      className="bg-white border border-gray-300 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" /> Tambah Slide
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.sliders?.map((slide, index) => (
                      <div
                        key={slide.id}
                        className="border border-gray-200 rounded-md p-4 bg-gray-50 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => removeSlider(slide.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white text-red-500 border border-red-200 rounded hover:bg-red-500 hover:text-white transition opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Hapus Slide"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col md:flex-row gap-5 items-start">
                          <div className="w-full md:w-56 flex flex-col gap-2 shrink-0">
                            <div className="h-32 bg-gray-200 border border-gray-300 rounded overflow-hidden flex items-center justify-center text-gray-400 relative">
                              {slide.image ? (
                                <img
                                  src={slide.image}
                                  alt="Slide"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-8 h-8" />
                              )}
                              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                                Slide {index + 1}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                openMediaSelector({
                                  type: "slider",
                                  id: slide.id,
                                })
                              }
                              className="w-full bg-white border border-gray-300 text-gray-700 py-1.5 rounded shadow-sm hover:bg-gray-50 font-medium transition text-xs"
                            >
                              Pilih Gambar Media
                            </button>
                          </div>

                          <div className="flex-1 space-y-3 w-full">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Judul Utama
                              </label>
                              <input
                                type="text"
                                value={slide.title}
                                onChange={(e) =>
                                  handleSliderChange(
                                    slide.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 p-2 text-sm font-bold rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Contoh: SELAMAT DATANG"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Sub Judul
                              </label>
                              <input
                                type="text"
                                value={slide.subtitle}
                                onChange={(e) =>
                                  handleSliderChange(
                                    slide.id,
                                    "subtitle",
                                    e.target.value,
                                  )
                                }
                                className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Deskripsi singkat slider..."
                              />
                            </div>
                            <div className="flex gap-4 pt-2">
                              <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Judul Tombol (Opsional)
                                </label>
                                <input
                                  type="text"
                                  value={slide.buttonText || ""}
                                  onChange={(e) =>
                                    handleSliderChange(
                                      slide.id,
                                      "buttonText",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500"
                                  placeholder="Contoh: Daftar Sekarang"
                                />
                              </div>
                              <div className="w-1/2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                  Link Tombol
                                </label>
                                <input
                                  type="text"
                                  value={slide.buttonLink || ""}
                                  onChange={(e) =>
                                    handleSliderChange(
                                      slide.id,
                                      "buttonLink",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500"
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!formData.sliders || formData.sliders.length === 0) && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-md text-gray-500 bg-gray-50">
                        Belum ada slide. Klik "Tambah Slide" untuk memulai.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB WARNA TEMA */}
              {activeTab === "warna" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl bg-gray-50 p-6 rounded-md border border-gray-200">
                    <div>
                      <label className="block font-semibold text-gray-800 mb-3">
                        Warna Utama (Primary)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="primaryColor"
                          value={formData.primaryColor || "#008e49"}
                          onChange={handleChange}
                          className="w-12 h-12 border-0 rounded cursor-pointer shadow-sm"
                        />
                        <input
                          type="text"
                          name="primaryColor"
                          value={formData.primaryColor || "#008e49"}
                          onChange={handleChange}
                          className="border border-gray-300 px-3 py-2 rounded-md w-28 font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-800 mb-3">
                        Warna Aksen (Accent)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="accentColor"
                          value={formData.accentColor || "#e09d00"}
                          onChange={handleChange}
                          className="w-12 h-12 border-0 rounded cursor-pointer shadow-sm"
                        />
                        <input
                          type="text"
                          name="accentColor"
                          value={formData.accentColor || "#e09d00"}
                          onChange={handleChange}
                          className="border border-gray-300 px-3 py-2 rounded-md w-28 font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block font-semibold text-gray-800 mb-3">
                        Warna Teks Utama (Body Text)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="bodyColor"
                          value={formData.bodyColor || "#1f2937"}
                          onChange={handleChange}
                          className="w-12 h-12 border-0 rounded cursor-pointer shadow-sm"
                        />
                        <input
                          type="text"
                          name="bodyColor"
                          value={formData.bodyColor || "#1f2937"}
                          onChange={handleChange}
                          className="border border-gray-300 px-3 py-2 rounded-md w-28 font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <label className="block font-semibold text-gray-800 mb-3">
                        Warna Latar Belakang (Background)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="bgColor"
                          value={formData.bgColor || "#ffffff"}
                          onChange={handleChange}
                          className="w-12 h-12 border-0 rounded cursor-pointer shadow-sm"
                        />
                        <input
                          type="text"
                          name="bgColor"
                          value={formData.bgColor || "#ffffff"}
                          onChange={handleChange}
                          className="border border-gray-300 px-3 py-2 rounded-md w-28 font-mono uppercase focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB TIPOGRAFI */}
              {activeTab === "tipografi" && (
                <div className="space-y-6 animate-fade-in max-w-xl">
                  <div className="bg-gray-50 p-6 rounded-md border border-gray-200 space-y-6">
                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">
                        Pilih Font Keluarga (Font Family)
                      </label>
                      <select
                        name="fontFamily"
                        value={formData.fontFamily || "Poppins"}
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Abel">Abel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-800 mb-2">
                        Ukuran Font Dasar (Base Font Size)
                      </label>
                      <select
                        name="fontSize"
                        value={formData.fontSize || "15px"}
                        onChange={handleChange}
                        className="border border-gray-300 px-3 py-2.5 rounded-md w-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="14px">14px (Kecil)</option>
                        <option value="15px">15px (Standar)</option>
                        <option value="16px">16px (Sedang)</option>
                        <option value="18px">18px (Besar)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Ukuran ini akan menjadi patokan (basis) untuk ukuran
                        teks paragraf dan menyesuaikan ukuran judul secara
                        otomatis.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-blue-700 shadow-sm transition"
              >
                Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>
      </div>

      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        mediaItems={mediaItems || []}
        onInsert={handleMediaSelect}
      />
    </div>
  );
};

export default SchoolabKit;

