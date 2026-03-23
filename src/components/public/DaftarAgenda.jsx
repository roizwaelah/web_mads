import React, { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setJsonLd } from '../../utils/seo';
import { safeJson } from '../../utils/http';

export default function DaftarAgenda({ agenda = [] }) {
  const [searchAgenda, setSearchAgenda] = useState('');
  const [remoteAgendas, setRemoteAgendas] = useState([]);
  const navigate = useNavigate();

  const fetchAgendas = async () => {
    try {
      const res = await fetch(`/api/agenda.php?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        setRemoteAgendas(data.data || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (Array.isArray(agenda) && agenda.length > 0) return;
    const controller = new AbortController();
    const loadAgendas = async () => {
      try {
        const res = await fetch(`/api/agenda.php?ts=${Date.now()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await safeJson(res);
        if (data.status === "success") {
          setRemoteAgendas(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadAgendas();
    return () => controller.abort();
  }, [agenda]);

  useEffect(() => {
    const onAgendasUpdated = () => fetchAgendas();
    const onStorage = (event) => {
      if (event.key === "agendas-updated-at") fetchAgendas();
    };
    const onFocus = () => fetchAgendas();
    window.addEventListener("agendas-updated", onAgendasUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("agendas-updated", onAgendasUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const agendaSource = agenda.length > 0 ? agenda : remoteAgendas;
  const publishedAgendas = agendaSource.filter((a) => {
    const status = (a.status || "").toString().toLowerCase();
    return !status || status === "publish";
  });
  const filteredAgendas = publishedAgendas.filter((item) =>
    (item.title || "").toLowerCase().includes(searchAgenda.toLowerCase()),
  );

  useEffect(() => {
    if (!filteredAgendas.length) return;
    const baseUrl = window.location.origin;
    const items = filteredAgendas.slice(0, 20).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/agenda/${item.id}`,
      name: item.title,
    }));
    setJsonLd('agenda-list-schema', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items,
    });
  }, [filteredAgendas]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-(--body-text) border-b-4 border-(--primary) inline-block pb-2">
            Agenda Madrasah
          </h1>
          <p className="text-gray-600 mt-2">Jadwal lengkap kegiatan, ujian, dan acara penting sekolah.</p>
        </div>

        <div className="w-full md:w-80 relative">
          <input 
            type="text"
            placeholder="Cari acara atau lokasi..."
            value={searchAgenda}
            onChange={(e) => setSearchAgenda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#008e49] focus:border-transparent outline-none transition-all shadow-sm"
          />
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {filteredAgendas.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 italic">Tidak ada agenda yang sesuai dengan kata kunci "{searchAgenda}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAgendas.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/agenda/${item.id}`)}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
            >
              <div className="bg-[#008e49] group-hover:bg-[#e09d00] transition-colors duration-300 p-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white to-transparent"></div>
                <span className="block text-5xl font-extrabold leading-none mb-1">
                  {item.formatted_date ? item.formatted_date.substring(0, 2) : '??'}
                </span>
                <span className="block text-sm font-medium uppercase tracking-widest text-emerald-100 group-hover:text-amber-100">
                  {item.formatted_date ? item.formatted_date.substring(3) : 'Bulan'}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2 group-hover:text-[#008e49] transition-colors">
                  {item.title}
                </h3>
                <div className="mt-auto space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#008e49] mt-0.5 shrink-0" />
                    <span>{item.event_time || '08:00 - Selesai'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-[#008e49] mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{item.location || 'Kampus Madrasah'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
