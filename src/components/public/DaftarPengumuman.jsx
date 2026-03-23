import React, { useEffect, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { safeJson } from '../../utils/http';
import { slugifyTitle } from '../../utils/content';

export default function DaftarPengumuman({ announcements = [] }) {
  const [searchPengumuman, setSearchPengumuman] = useState('');
  const [remoteAnnouncements, setRemoteAnnouncements] = useState([]);
  const navigate = useNavigate();

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`/api/announcements.php?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        setRemoteAnnouncements(data.data || []);
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
          cache: "no-store",
        });
        const data = await safeJson(res);
        if (data.status === "success") {
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
    window.addEventListener("announcements-updated", onAnnouncementsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("announcements-updated", onAnnouncementsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const announcementSource =
    announcements.length > 0 ? announcements : remoteAnnouncements;
  const publishedAnnouncements = announcementSource.filter((a) => {
    const status = (a.status || "").toString().toLowerCase();
    return !status || status === "publish";
  });
  const filteredAnnouncements = publishedAnnouncements.filter((item) =>
    (item.title || "").toLowerCase().includes(searchPengumuman.toLowerCase()),
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-(--body-text) border-b-4 border-(--primary) inline-block pb-2">
            Daftar Pengumuman
          </h1>
          <p className="text-gray-600 mt-2">Pusat informasi resmi, edaran, dan pemberitahuan madrasah.</p>
        </div>

        <div className="w-full md:w-72 relative">
          <input 
            type="text"
            placeholder="Cari pengumuman..."
            value={searchPengumuman}
            onChange={(e) => setSearchPengumuman(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 italic">Tidak ada pengumuman yang sesuai dengan kata kunci "{searchPengumuman}".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAnnouncements.map((item) => {
            const dateParts = item.date ? item.date.split('/') : ['??', '??', '????'];
            const day = dateParts[0];
            const month = dateParts[1];

            return (
              <div 
                key={item.id}
                onClick={() => navigate(`/pengumuman/${item.slug || slugifyTitle(item.title)}`)}
                className="group flex flex-col sm:flex-row gap-6 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 cursor-pointer"
              >
                <div className="shrink-0 flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-0 sm:w-24 sm:border-r border-gray-100 sm:pr-6">
                  <div className="text-4xl font-extrabold text-emerald-600 group-hover:text-amber-500 transition-colors">
                    {day}
                  </div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                    BLN {month}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 text-sm">
                    {item.content?.replace(/<[^>]*>?/gm, '')}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-600 opacity-80 group-hover:opacity-100 transition-opacity">
                    Baca Selengkapnya <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
