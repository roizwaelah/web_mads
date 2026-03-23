import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { safeJson } from "../../../utils/http";

const AgendaEditor = ({ showToast, setAgendas, agendas }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingAgenda = id
    ? agendas?.find((a) => a.id?.toString() === id)
    : null;
  const [remoteAgenda, setRemoteAgenda] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!id || editingAgenda) return;
    let active = true;
    const loadAgenda = async () => {
      try {
        const res = await fetch(`/api/agenda.php?id=${id}&ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data.status === "success") {
          const payload = data.data ?? data;
          const found = Array.isArray(payload) ? payload[0] : payload;
          if (found) setRemoteAgenda(found);
        }
      } catch {
        // ignore
      }
    };
    loadAgenda();
    return () => {
      active = false;
    };
  }, [id, editingAgenda]);

  const activeAgenda = editingAgenda || remoteAgenda;

  useEffect(() => {
    if (activeAgenda) {
      setTitle(activeAgenda.title || '');
      setDescription(activeAgenda.description || '');
      setEventDate(activeAgenda.event_date || '');
      setEventTime(activeAgenda.event_time || '');
      setLocation(activeAgenda.location || '');
    } else if (!id) {
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setLocation('');
    }
  }, [activeAgenda, id]);

  const handleSave = async (statusTujuan) => {
    if (!title.trim() || !eventDate) {
      showToast('Judul dan Tanggal Acara wajib diisi!');
      return;
    }

    showToast('Menyimpan agenda...');

    const agendaData = {
      id: editingAgenda ? editingAgenda.id : null,
      title, description, event_date: eventDate, event_time: eventTime, location,
      status: statusTujuan
    };

    try {
      const response = await fetch('/api/agenda.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaData)
      });
      const result = await safeJson(response).catch(() => ({}));

      if (result.status === 'success') {
        showToast(result.message);
        const resAgendas = await fetch(`/api/agenda.php?ts=${Date.now()}`, { cache: "no-store" });
        const dataAgendas = await safeJson(resAgendas).catch(() => ({}));
        if (dataAgendas.status === 'success') setAgendas?.(dataAgendas.data);
        try {
          localStorage.setItem("agendas-updated-at", String(Date.now()));
        } catch {
          // ignore
        }
        window.dispatchEvent(new Event("agendas-updated"));
        navigate("/admin/agenda");
      } else {
        showToast(`Gagal: ${result.message}`);
      }
    } catch (error) {
      showToast('Koneksi ke server gagal.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-normal text-gray-800">
          {editingAgenda ? 'Sunting Agenda' : 'Tambah Agenda Baru'}
        </h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* KOLOM KIRI */}
        <div className="flex-1 space-y-4">
          <input type="text" placeholder="Nama Agenda / Acara" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 px-3 py-2 rounded text-xl focus:outline-none focus:border-blue-600 shadow-inner font-semibold bg-white" />
          
          <div className="bg-white shadow-sm rounded border border-gray-300">
            <style>{`.quill-editor .ql-container { min-height: 250px; } .quill-editor .ql-toolbar { background-color: #f9fafb; border-top: none; border-left: none; border-right: none; }`}</style>
            <ReactQuill theme="snow" value={description} onChange={setDescription} className="quill-editor" placeholder="Tulis rincian atau deskripsi acara di sini..." />
          </div>
        </div>

        {/* KOLOM KANAN (Pengaturan Waktu & Lokasi) */}
        <div className="w-full lg:w-80 space-y-6 text-sm">
          
          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">Terbitkan</div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <button onClick={() => handleSave('Draft')} className="border border-blue-600 text-blue-600 bg-gray-50 px-3 py-1 rounded shadow-sm hover:bg-blue-50 transition">Simpan Draft</button>
              </div>
              <p className="text-gray-500">Status: <span className="font-bold text-gray-800">{activeAgenda ? activeAgenda.status : 'Baru'}</span></p>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button onClick={() => handleSave('Publish')} className="bg-blue-600 text-white px-4 py-1.5 rounded font-medium hover:bg-blue-700 shadow-sm transition">
                {activeAgenda ? 'Perbarui' : 'Publish'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-300 shadow-sm flex flex-col rounded-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">Detail Acara</div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-700 mb-1 font-semibold">Tanggal Pelaksanaan <span className="text-red-500">*</span></label>
                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white" required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-semibold">Waktu (Jam)</label>
                <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white" />
              </div>
              <div>
                <label className="block text-gray-700 mb-1 font-semibold">Lokasi / Tempat</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Aula Utama" className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-600 bg-white" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgendaEditor;

