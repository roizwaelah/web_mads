import React, { useEffect, useState } from 'react';
import { Bell, ArrowRight, Megaphone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { safeJson } from '../../utils/http';
import { slugifyTitle } from '../../utils/content';

export default function SectionPengumuman({ announcements = [], goToAnnouncements }) {
  const navigate = useNavigate();
  const [remoteAnnouncements, setRemoteAnnouncements] = useState([]);

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) return;
    try {
      const cached = localStorage.getItem("public-announcements-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setRemoteAnnouncements(parsed);
      }
    } catch {
      // ignore
    }
  }, [announcements]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/announcements.php?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await safeJson(res);
      if (data.status === 'success') {
        const items = data.data || [];
        setRemoteAnnouncements(items);
        try {
          localStorage.setItem("public-announcements-cache", JSON.stringify(items));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) return;
    const controller = new AbortController();
    const loadAnnouncements = async () => {
      try {
        const res = await fetch(`/api/announcements.php?ts=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await safeJson(res);
        if (data.status === 'success') {
          setRemoteAnnouncements(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadAnnouncements();
    return () => controller.abort();
  }, [announcements]);

  useEffect(() => {
    const onAnnouncementsUpdated = () => fetchAnnouncements();
    const onStorage = (event) => {
      if (event.key === "announcements-updated-at") fetchAnnouncements();
    };
    const onFocus = () => fetchAnnouncements();
    const intervalId = setInterval(fetchAnnouncements, 60000);
    window.addEventListener("announcements-updated", onAnnouncementsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("announcements-updated", onAnnouncementsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const announcementSource = announcements.length > 0 ? announcements : remoteAnnouncements;
  const latestAnnouncements = (announcementSource || [])
    .filter((item) => {
      const status = (item.status || '').toString().toLowerCase();
      return !status || status === 'publish';
    })
    .slice(0, 4);

  if (latestAnnouncements.length === 0) return null;

  const handleGoToAnnouncements = (item) => {
    if (goToAnnouncements) return goToAnnouncements(item);
    if (item?.id) return navigate(`/pengumuman/${item.slug || slugifyTitle(item.title)}`);
    navigate('/pengumuman');
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/3">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full mb-6">
              <Megaphone className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Info Penting</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-6">
              Pengumuman <br />
              <span className="text-[#008e49]">Akademik & Madrasah</span>
            </h2>
            <p className="text-(--body-text) mb-8">
              Dapatkan informasi resmi terbaru mengenai kegiatan madrasah, jadwal ujian, dan pemberitahuan penting lainnya di sini.
            </p>
            <button
              onClick={() => handleGoToAnnouncements()}
              className="group flex items-center gap-3 bg-[#008e49] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#006b37] transition-all shadow-lg shadow-emerald-100"
            >
              Lihat Semua Pengumuman
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="lg:w-2/3 grid grid-cols-1 gap-4">
            {latestAnnouncements.map((item) => (
              <div
                key={item.id}
                className="group relative bg-gray-50 hover:bg-white p-5 rounded-2xl border border-transparent hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300 cursor-pointer"
                onClick={() => handleGoToAnnouncements(item)}
              >
                <div className="flex items-start gap-5">
                  <div className="bg-white group-hover:bg-emerald-500 p-3 rounded-xl shadow-sm transition-colors">
                    <Bell className="w-6 h-6 text-[#008e49] group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 text-xs text-gray-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{item.date || 'Baru Saja'}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#008e49] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-1 mt-1">
                      {item.content?.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                    </p>
                  </div>
                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-[#008e49]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChevronRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
