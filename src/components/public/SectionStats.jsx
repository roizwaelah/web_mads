import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizeMediaUrl, safeJson } from '../../utils/http';

export default function Stats({
  gurus = [],
  prestasi = [],
  fasilitas = [],
  ekskul = [],
  sambutanKepala = "",
  sambutanFoto = "",
  sambutanLinkSlug = "",
}) {
  const [remoteGurus, setRemoteGurus] = useState([]);
  const [remoteFasilitas, setRemoteFasilitas] = useState([]);
  const [remoteEkskul, setRemoteEkskul] = useState([]);
  const [remoteSambutan, setRemoteSambutan] = useState({
    sambutanKepala: "",
    sambutanFoto: "",
    sambutanLinkSlug: "",
  });

  useEffect(() => {
    const needsCounts =
      gurus.length === 0 || fasilitas.length === 0 || ekskul.length === 0;
    const needsSambutan =
      !sambutanKepala && !sambutanFoto && !sambutanLinkSlug;
    if (!needsCounts && !needsSambutan) return;

    const controller = new AbortController();
    const loadFallback = async () => {
      try {
        const requests = [];
        requests.push(
          gurus.length === 0
            ? fetch(`/api/gurus.php?ts=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-store',
              })
            : Promise.resolve(null),
        );
        requests.push(
          fasilitas.length === 0
            ? fetch(`/api/facilities.php?ts=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-store',
              })
            : Promise.resolve(null),
        );
        requests.push(
          ekskul.length === 0
            ? fetch(`/api/ekskul.php?ts=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-store',
              })
            : Promise.resolve(null),
        );
        requests.push(
          needsSambutan
            ? fetch(`/api/settings.php?ts=${Date.now()}`, {
                signal: controller.signal,
                cache: 'no-store',
              })
            : Promise.resolve(null),
        );

        const [resGurus, resFasilitas, resEkskul, resSettings] = await Promise.all(
          requests,
        );

        if (resGurus) {
          const data = await safeJson(resGurus);
          if (data.status === 'success') setRemoteGurus(data.data || []);
        }
        if (resFasilitas) {
          const data = await safeJson(resFasilitas);
          if (data.status === 'success') setRemoteFasilitas(data.data || []);
        }
        if (resEkskul) {
          const data = await safeJson(resEkskul);
          if (data.status === 'success') setRemoteEkskul(data.data || []);
        }
        if (resSettings) {
          const data = await safeJson(resSettings);
          if (data.status === 'success' && data.data) {
            setRemoteSambutan({
              sambutanKepala: data.data.sambutanKepala || '',
              sambutanFoto: data.data.sambutanFoto || '',
              sambutanLinkSlug: data.data.sambutanLinkSlug || '',
            });
          }
        }
      } catch {
        // ignore
      }
    };

    loadFallback();
    return () => controller.abort();
  }, [gurus, fasilitas, ekskul, sambutanKepala, sambutanFoto, sambutanLinkSlug]);

  const guruSource = gurus.length > 0 ? gurus : remoteGurus;
  const fasilitasSource = fasilitas.length > 0 ? fasilitas : remoteFasilitas;
  const ekskulSource = ekskul.length > 0 ? ekskul : remoteEkskul;
  const sambutan = {
    sambutanKepala: sambutanKepala || remoteSambutan.sambutanKepala,
    sambutanFoto: sambutanFoto || remoteSambutan.sambutanFoto,
    sambutanLinkSlug: sambutanLinkSlug || remoteSambutan.sambutanLinkSlug,
  };

  const sambutanText = (sambutan.sambutanKepala || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&amp;nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {sambutan.sambutanFoto && (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-gray-200 shadow-sm shrink-0">
              <img
                src={normalizeMediaUrl(sambutan.sambutanFoto)}
                alt="Foto Kepala Madrasah"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-(--primary) mb-4">
              Sambutan Kepala Madrasah
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed line-clamp-5">
              {sambutanText || "Sambutan kepala madrasah belum diatur."}
            </p>
            {sambutan.sambutanLinkSlug && (
              <Link
                to={`/page/${sambutan.sambutanLinkSlug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-(--primary,#008e49) px-4 py-2 rounded-full hover:opacity-90 transition"
              >
                Selengkapnya
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-4 w-full text-center divide-x divide-gray-200 border-b border-gray-200 pb-8 mb-8">
            <div>
              <h3 className="text-4xl font-bold text-gray-800">{guruSource.length}</h3>
              <p className="text-xs font-bold text-gray-500 mt-2">GURU</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-gray-800">{prestasi.length}</h3>
              <p className="text-xs font-bold text-gray-500 mt-2">PRESTASI</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-gray-800">{fasilitasSource.length}</h3>
              <p className="text-xs font-bold text-gray-500 mt-2">FASILITAS</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-gray-800">{ekskulSource.length}</h3>
              <p className="text-xs font-bold text-gray-500 mt-2">EKSKUL</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
