import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Calendar, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { setJsonLd, setSeoMeta } from '../../utils/seo';
import { safeJson } from '../../utils/http';

export default function DetailPengumuman({ announcements = [] }) {
  const { id } = useParams();
  const [remoteAnnouncement, setRemoteAnnouncement] = useState(null);
  const [loading, setLoading] = useState(announcements.length === 0);
  const navigate = useNavigate();

  const fetchAnnouncement = async (signal) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/announcements.php?id=${id}&ts=${Date.now()}`, {
        signal,
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        const payload = data.data ?? data;
        const item = Array.isArray(payload) ? payload[0] : payload;
        setRemoteAnnouncement(item || null);
      }
    } catch {
      // ignore
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) {
      setLoading(false);
      return;
    }
    if (!id) return;
    const controller = new AbortController();
    fetchAnnouncement(controller.signal);
    return () => controller.abort();
  }, [announcements, id]);

  const announcementSource = announcements.length > 0 ? announcements : remoteAnnouncement ? [remoteAnnouncement] : [];
  const activeData = announcementSource.find(a => a?.id?.toString() === id);

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) return;
    const onAnnouncementsUpdated = () => fetchAnnouncement();
    const onStorage = (event) => {
      if (event.key === "announcements-updated-at") fetchAnnouncement();
    };
    const onFocus = () => fetchAnnouncement();
    window.addEventListener("announcements-updated", onAnnouncementsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("announcements-updated", onAnnouncementsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [announcements, id]);

  useEffect(() => {
    if (!activeData?.id) return;
    const baseUrl = window.location.origin;
    const url = window.location.href || `${baseUrl}/pengumuman/${activeData.id}`;
    const title = activeData.title || 'Pengumuman Sekolah';
    const plain = (activeData.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = plain.slice(0, 160) || 'Pengumuman resmi sekolah.';

    setSeoMeta({
      title: `${title} | Pengumuman`,
      description,
      image: '/favicon.png',
      url,
      type: 'article',
    });

    setJsonLd(`announcement-${activeData.id}`, {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      datePublished: activeData.date || undefined,
      mainEntityOfPage: url,
    });
  }, [activeData?.id]);

  if (loading) return <div className="p-20 text-center">Memuat pengumuman...</div>;
  if (!activeData) return <div className="p-20 text-center">Pengumuman tidak ditemukan.</div>;

  const shareWhatsapp = () => {
    const url = window.location.href;
    const title = activeData.title || "Pengumuman";
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(
      `${title} ${url}`,
    )}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-[fadeIn_0.3s_ease-in]">
      <button 
        onClick={() => navigate('/pengumuman')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar Pengumuman
      </button>

      <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8 md:p-12">
        <header className="border-b border-gray-100 pb-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
              <Bell className="w-3 h-3" /> Informasi
            </span>
            <span className="text-gray-400 text-sm font-medium flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Diterbitkan: {activeData.date}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {activeData.title}
          </h1>
        </header>

        <div 
          className="prose prose-lg prose-emerald max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: activeData.content }}
        />
        
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="text-sm border border-gray-200 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white hover:text-emerald-600 transition-colors"
          >
            Cetak Pengumuman
          </button>
          <button
            onClick={shareWhatsapp}
            className="text-sm border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Bagikan WA
          </button>
        </div>
      </div>
    </main>
  );
}

