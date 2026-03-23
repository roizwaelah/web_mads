import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
import { safeJson } from '../../utils/http';

export default function SectionAgenda({ agenda = [], goToAgenda }) {
  const navigate = useNavigate();
  const [remoteAgendas, setRemoteAgendas] = useState([]);

  useEffect(() => {
    if (Array.isArray(agenda) && agenda.length > 0) return;
    try {
      const cached = localStorage.getItem("public-agendas-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setRemoteAgendas(parsed);
      }
    } catch {
      // ignore
    }
  }, [agenda]);

  const fetchAgendas = async () => {
    try {
      const res = await fetch(`/api/agenda.php?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await safeJson(res);
      if (data.status === 'success') {
        const items = data.data || [];
        setRemoteAgendas(items);
        try {
          localStorage.setItem("public-agendas-cache", JSON.stringify(items));
        } catch {
          // ignore
        }
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
          cache: 'no-store',
        });
        const data = await safeJson(res);
        if (data.status === 'success') {
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
    const intervalId = setInterval(fetchAgendas, 60000);
    window.addEventListener("agendas-updated", onAgendasUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("agendas-updated", onAgendasUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const agendaSource = agenda.length > 0 ? agenda : remoteAgendas;
  const latestAgendas = (agendaSource || [])
    .filter((item) => {
      const status = (item.status || '').toString().toLowerCase();
      return !status || status === 'publish';
    })
    .slice(0, 2);

  if (latestAgendas.length === 0) return null;

  const handleGoToAgenda = () => {
    if (goToAgenda) return goToAgenda();
    navigate('/agenda');
  };

  return (
    <section className="py-16 bg-(--bg-site)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Agenda <span className="text-[#008e49]">Madrasah</span>
            </h2>
            <p className="text-(--body-text) mt-2">
              Jadwal kegiatan dan acara mendatang di madrasah kami.
            </p>
          </div>
          <button
            onClick={handleGoToAgenda}
            className="hidden md:flex items-center gap-2 text-[#008e49] font-semibold hover:text-[#006b37] transition-colors"
          >
            Lihat Semua Agenda <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestAgendas.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/agenda/${item.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="flex">
                <div className="bg-[#008e49] text-white w-24 flex flex-col items-center justify-center p-4 group-hover:bg-[#e09d00] transition-colors duration-300">
                  <span className="text-3xl font-bold leading-none">
                    {item.formatted_date ? item.formatted_date.substring(0, 2) : '??'}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-tighter mt-1 text-emerald-100">
                    {item.formatted_date ? item.formatted_date.substring(3) : 'Bulan'}
                  </span>
                </div>

                <div className="flex-1 p-5">
                  <h3 className="font-bold text-gray-800 line-clamp-2 mb-3 group-hover:text-[#008e49] transition-colors">
                    {item.title}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-[#008e49]" />
                      <span>{item.event_time || '08:00 - Selesai'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-[#008e49]" />
                      <span className="line-clamp-1">{item.location || 'Kampus Madrasah'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <button
            onClick={handleGoToAgenda}
            className="w-full py-3 bg-white border border-[#008e49] text-[#008e49] rounded-xl font-bold flex items-center justify-center gap-2"
          >
            Lihat Semua Agenda <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
