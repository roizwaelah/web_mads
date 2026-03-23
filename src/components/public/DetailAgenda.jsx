import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { safeJson } from "../../utils/http";

export default function DetailAgenda({ agenda = [] }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remoteAgenda, setRemoteAgenda] = useState(null);
  const [loading, setLoading] = useState(agenda.length === 0);

  const fetchAgenda = async (signal) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/agenda.php?id=${id}&ts=${Date.now()}`, {
        signal,
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        const payload = data.data ?? data;
        const item = Array.isArray(payload) ? payload[0] : payload;
        setRemoteAgenda(item || null);
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
    if (Array.isArray(agenda) && agenda.length > 0) {
      setLoading(false);
      return;
    }
    if (!id) return;
    const controller = new AbortController();
    fetchAgenda(controller.signal);
    return () => controller.abort();
  }, [agenda, id]);

  useEffect(() => {
    if (Array.isArray(agenda) && agenda.length > 0) return;
    const onAgendasUpdated = () => fetchAgenda();
    const onStorage = (event) => {
      if (event.key === "agendas-updated-at") fetchAgenda();
    };
    const onFocus = () => fetchAgenda();
    window.addEventListener("agendas-updated", onAgendasUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("agendas-updated", onAgendasUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [agenda, id]);

  const agendaSource = agenda.length > 0 ? agenda : remoteAgenda ? [remoteAgenda] : [];
  const activeData = agendaSource.find((item) => item?.id?.toString() === id);

  if (loading) {
    return <div className="p-20 text-center">Memuat agenda...</div>;
  }

  if (!activeData) {
    return <div className="p-20 text-center">Agenda tidak ditemukan.</div>;
  }

  const shareWhatsapp = () => {
    const url = window.location.href;
    const title = activeData.title || "Agenda";
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(
      `${title} ${url}`,
    )}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-[fadeIn_0.3s_ease-in]">
      <button
        onClick={() => navigate("/agenda")}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Agenda
      </button>

      <div className="bg-white border border-gray-100 shadow-lg rounded-3xl p-8 md:p-12">
        <header className="border-b border-gray-100 pb-8 mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase">
              <Calendar className="w-3 h-3" />
              Agenda
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {activeData.formatted_date || activeData.event_date || "-"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {activeData.event_time || "08:00 - Selesai"}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {activeData.location || "Kampus Madrasah"}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {activeData.title}
          </h1>
        </header>

        <div
          className="prose prose-lg prose-emerald max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: activeData.description || "" }}
        />

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="text-sm border border-gray-200 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white hover:text-emerald-600 transition-colors"
          >
            Cetak Agenda
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
