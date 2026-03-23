import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pin, FileText, Users, LayoutDashboard, Sparkles, CalendarDays, Rocket } from 'lucide-react';

const Dashboard = ({
  navigate,
  showToast,
  posts = [],
  setPosts = () => {},
  themeSettings,
  pages = [],
  gurus = [],
  announcements = [],
  agendas = [],
}) => {
  const routerNavigate = useNavigate();
  const goTo = typeof navigate === 'function' ? navigate : routerNavigate;
  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === 'Publish');
  const draftPosts = posts.filter((p) => p.status === 'Draft');
  const latestPosts = posts.slice(0, 5);
  const latestAnnouncements = announcements.slice(0, 5);
  const latestAgendas = agendas.slice(0, 5);

  const isSchoolabConfigured = useMemo(() => {
    const hasUmum = Boolean(
      themeSettings?.sambutanKepala ||
      themeSettings?.sambutanFoto ||
      themeSettings?.sambutanLinkSlug
    );

    const hasHeaderFooter = Boolean(
      themeSettings?.schoolName ||
      themeSettings?.schoolDescription ||
      themeSettings?.logoUrl ||
      themeSettings?.faviconUrl
    );

    const hasContact = Boolean(
      themeSettings?.phone ||
      themeSettings?.email ||
      themeSettings?.address
    );

    const social = themeSettings?.social || {};
    const hasSocial = Boolean(
      social.facebook || social.twitter || social.instagram || social.youtube
    );

    const hasSlider =
      Array.isArray(themeSettings?.sliders) && themeSettings.sliders.length > 0;

    return hasUmum && hasHeaderFooter && hasContact && hasSocial && hasSlider;
  }, [themeSettings]);

  const missingSections = useMemo(() => {
    const missing = [];
    const hasUmum = Boolean(
      themeSettings?.sambutanKepala ||
      themeSettings?.sambutanFoto ||
      themeSettings?.sambutanLinkSlug
    );
    if (!hasUmum) missing.push("Pengaturan Umum");

    const hasHeaderFooter = Boolean(
      themeSettings?.schoolName ||
      themeSettings?.schoolDescription ||
      themeSettings?.logoUrl ||
      themeSettings?.faviconUrl
    );
    if (!hasHeaderFooter) missing.push("Header & Footer");

    const hasContact = Boolean(
      themeSettings?.phone ||
      themeSettings?.email ||
      themeSettings?.address
    );
    if (!hasContact) missing.push("Kontak & Alamat");

    const social = themeSettings?.social || {};
    const hasSocial = Boolean(
      social.facebook || social.twitter || social.instagram || social.youtube
    );
    if (!hasSocial) missing.push("Sosial Media");

    const hasSlider =
      Array.isArray(themeSettings?.sliders) && themeSettings.sliders.length > 0;
    if (!hasSlider) missing.push("Home Slider");

    return missing;
  }, [themeSettings]);


  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2271b1]/10 text-[#2271b1] flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[23px] font-semibold text-[#1d2327]">Dashboard</h1>
            <p className="text-[12px] text-gray-500">Ringkasan cepat untuk mengelola situs Anda.</p>
          </div>
        </div>
        <button
          onClick={() => goTo('posts')}
          className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold truncate cursor-pointer"
        >
          <Rocket className="w-4 h-4" /> Tulis Artikel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-500">Total Artikel</div>
              <div className="text-2xl font-semibold text-gray-800">{totalPosts}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#2271b1]/10 text-[#2271b1] flex items-center justify-center">
              <Pin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[12px] text-gray-500">
            Publish: <span className="text-gray-800 font-semibold">{publishedPosts.length}</span> · Draft: <span className="text-gray-800 font-semibold">{draftPosts.length}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-500">Total Laman</div>
              <div className="text-2xl font-semibold text-gray-800">{pages ? pages.length : 0}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[12px] text-gray-500">Kelola konten statis situs.</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-500">Guru & Staff</div>
              <div className="text-2xl font-semibold text-gray-800">{gurus.length}</div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-[12px] text-gray-500">Perbarui profil pengajar.</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm mb-6 p-6 relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-[#2271b1]/10 via-transparent to-transparent"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-[#2271b1] text-sm font-semibold mb-2">
            <Sparkles className="w-4 h-4" /> Konfigurasi Situs
          </div>
          <h2 className="text-xl font-bold text-[#1d2327] mb-2">Selamat Datang di DP Admin Panel!</h2>
          {!isSchoolabConfigured && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] mt-4">
              <div>
                <button
                  onClick={() => goTo('schoolab')}
                  className="inline-block bg-[#2271b1] text-white px-4 py-1.5 rounded hover:bg-[#135e96] transition mb-2 shadow-sm"
                >
                  Sesuaikan Situs Anda
                </button>
                {missingSections.length > 0 && (
                  <div className="mt-3 text-[12px] text-gray-600">
                    <div className="mb-2 text-gray-500">Bagian belum diisi:</div>
                    <div className="flex flex-wrap gap-2">
                      {missingSections.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-[11px] font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-800">Rencana Hari Ini</div>
                  <div className="text-[12px]">Pastikan slider dan sambutan sudah diperbarui.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* WIDGET 1: SEKILAS (Menampilkan jumlah pos dinamis) */}
        <div className="bg-white border border-gray-200 shadow-sm flex flex-col rounded-lg">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-[#1d2327] text-[13px]">
            Sekilas
          </div>
          <div className="p-4 text-[13px] text-gray-600 flex-1 space-y-4">
            <div className="border-t border-gray-100 pt-3">
              <div className="text-[12px] text-gray-500 mb-2">Artikel terbaru</div>
              <div className="space-y-2">
                {latestPosts.length === 0 ? (
                  <div className="text-[12px] text-gray-400">Belum ada artikel.</div>
                ) : (
                  latestPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => goTo(`posts/edit/${post.id}`)}
                      className="w-full text-left text-[12px] text-gray-700 hover:text-[#2271b1] truncate cursor-pointer"
                    >
                      {post.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="text-[12px] text-gray-500 mb-2">Pengumuman terbaru</div>
              <div className="space-y-2">
                {latestAnnouncements.length === 0 ? (
                  <div className="text-[12px] text-gray-400">Belum ada pengumuman.</div>
                ) : (
                  latestAnnouncements.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goTo(`announcements/edit/${item.id}`)}
                      className="w-full text-left text-[12px] text-gray-700 hover:text-[#2271b1] truncate cursor-pointer"
                    >
                      {item.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="text-[12px] text-gray-500 mb-2">Agenda terbaru</div>
              <div className="space-y-2">
                {latestAgendas.length === 0 ? (
                  <div className="text-[12px] text-gray-400">Belum ada agenda.</div>
                ) : (
                  latestAgendas.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goTo(`agenda/edit/${item.id}`)}
                      className="w-full text-left text-[12px] text-gray-700 hover:text-[#2271b1] truncate cursor-pointer"
                    >
                      {item.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* WIDGET 2: STATISTIK PENGUNJUNG (hidden until data available) */}
      </div>
    </div>
  );
};

export default Dashboard;
