import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube, User } from 'lucide-react';

export default function Footer({ themeSettings, isBlankTemplate }) {
  const navigate = useNavigate();

  if (isBlankTemplate) return null; 

  return (
    <footer id="site-footer" className="bg-(--primary,#008e49) text-white pt-10 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        {/* Kolom Profil */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-bold text-3xl tracking-wide">
              {themeSettings?.schoolName || 'MA Darussalam'}
            </h3>
          </div>
          <p className="text-sm opacity-90 leading-relaxed mb-6">
            {themeSettings?.schoolDescription || 'Salah satu lembaga formal dari Yayasan Pendidikan Islam Darussalam Cilongok di bawah naungan Kementerian Agama yang berkomitmen mencetak generasi unggul, berprestasi, dan berakhlakul karimah.'}
          </p>
        </div>

        {/* Kolom Kontak */}
        <div>
          <h3 className="font-bold text-xl mb-6 tracking-wide border-b border-white/20 pb-3 inline-block">Kontak Kami</h3>
          <div className="space-y-4 text-sm opacity-90">
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-(--accent,#e09d00)" />
              </span>
              {themeSettings?.phone || '-'}
            </p>
            <p className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-(--accent,#e09d00)" />
              </span>
              {themeSettings?.email || '-'}
            </p>
            <p className="flex items-start gap-3 leading-relaxed mt-2">
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-(--accent,#e09d00)" />
              </span>
              {themeSettings?.address || 'Alamat belum diatur'}
            </p>
          </div>
        </div>

        {/* Kolom Sosial Media & Login */}
        <div>
          <h3 className="font-bold text-xl mb-6 tracking-wide border-b border-white/20 pb-3 inline-block">Sosial Media</h3>
          <div className="flex gap-3 mb-8">
            {themeSettings?.social?.facebook && (
              <a aria-label="Facebook (membuka tab baru)" href={themeSettings.social.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-(--accent,#e09d00) hover:text-white transition shadow-sm hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300">
                <Facebook className="w-5 h-5"/>
              </a>
            )}
            {themeSettings?.social?.twitter && (
              <a aria-label="Twitter/X (membuka tab baru)" href={themeSettings.social.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-(--accent,#e09d00) hover:text-white transition shadow-sm hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300">
                <Twitter className="w-5 h-5"/>
              </a>
            )}
            {themeSettings?.social?.instagram && (
              <a aria-label="Instagram (membuka tab baru)" href={themeSettings.social.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-(--accent,#e09d00) hover:text-white transition shadow-sm hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300">
                <Instagram className="w-5 h-5"/>
              </a>
            )}
            {themeSettings?.social?.youtube && (
              <a aria-label="YouTube (membuka tab baru)" href={themeSettings.social.youtube} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-(--accent,#e09d00) hover:text-white transition shadow-sm hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300">
                <Youtube className="w-5 h-5"/>
              </a>
            )}
          </div>
          <button 
            type="button"
            aria-label="Masuk ke halaman admin"
            onClick={() => navigate('/admin')} 
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-(--accent,#e09d00) hover:bg-white hover:text-(--primary,#008e49) border border-transparent rounded-lg transition-all font-semibold text-sm shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            <User className="w-4 h-4" /> Login Operator
          </button>
        </div>
      </div>
      <div className="border-t border-white/20 py-2 px-4 text-center bg-black/10">
        <p className="text-xs opacity-70 font-medium tracking-wide">
          (c) {new Date().getFullYear()} {themeSettings?.schoolName || 'MA Darussalam Cilongok'} | Madrasah Hebat Bermartabat
        </p>
      </div>
    </footer>
  );
}
