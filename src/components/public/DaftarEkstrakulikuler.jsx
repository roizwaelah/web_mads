import React, { useState, useEffect } from 'react';
import { Clock, User, Activity } from 'lucide-react';
import { normalizeMediaUrl, safeJson } from '../../utils/http';

const DaftarEkstrakulikuler = () => {
  const [ekskul, setEkskul] = useState([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const controller = new AbortController();
    const loadEkskul = async () => {
      try {
        const res = await fetch(`/api/ekskul.php?ts=${Date.now()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = await safeJson(res);
        if (result.status === "success") {
          setEkskul(result.data || []);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Gagal memuat data ekstrakurikuler:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    loadEkskul();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16 animate-fade-in">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-(--body-text) mb-4">
          Ekstrakurikuler <span className="text-(--primary)">Madrasah</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Berbagai program ekstrakurikuler unggulan yang kami sediakan.
        </p>
        <div className="w-24 h-1 bg-(--primary) mx-auto mt-6 rounded-full"></div>
      </div>

      {/* Konten Utama */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((skeleton) => (
              <div key={skeleton} className="bg-white rounded-2xl h-96 animate-pulse shadow-sm"></div>
            ))}
          </div>
        ) : ekskul.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-500">Belum ada data ekstrakurikuler</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ekskul.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 flex flex-col"
              >
                {/* Gambar Image */}
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={normalizeMediaUrl(item.image || item.img || 'https://placehold.co/600x400')} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">
                    {item.category || 'Umum'}
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1">
                    {item.description}
                  </p>
                  
                  {/* Meta Data (Jadwal & Pembina) */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-3 text-blue-500" />
                      <span className="font-medium text-gray-700 mr-1">Pembina:</span> 
                      {item.coach || '-'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-3 text-green-500" />
                      <span className="font-medium text-gray-700 mr-1">Jadwal:</span> 
                      {item.schedule || 'Menyesuaikan'}
                    </div>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DaftarEkstrakulikuler;


