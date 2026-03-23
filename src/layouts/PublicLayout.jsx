import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/public/Header';
import Footer from '../components/public/Footer';
import { setJsonLd, setSeoMeta } from '../utils/seo';

// PENTING: Tangkap { themeSettings } di dalam kurung parameter ini
export default function PublicLayout({ themeSettings }) {
  const location = useLocation();
  
  useEffect(() => {
    if (themeSettings) {
      const root = document.documentElement;

      // 1. Suntik Warna dari Database ke Variabel CSS
      root.style.setProperty('--primary', themeSettings.primaryColor || '##006b37');
      root.style.setProperty('--accent', themeSettings.accentColor || '#e09d00');
      root.style.setProperty('--body-text', themeSettings.bodyColor || '#374151');
      root.style.setProperty('--bg-site', themeSettings.bgColor || '#f9fafb');

      // 2. Suntik Tipografi
      // Mengatur ukuran font dasar (misal: 16px)
      root.style.setProperty('--base-font-size', themeSettings.fontSize || '16px');
      root.style.fontSize = themeSettings.fontSize || '16px';

      // Jika ada font family khusus di database
      if (themeSettings.fontFamily) {
        root.style.fontFamily = themeSettings.fontFamily;
      }
    }
  }, [themeSettings]);

  useEffect(() => {
    const schoolName = themeSettings?.schoolName || 'MA Darussalam Cilongok';
    const description =
      themeSettings?.schoolDescription ||
      'Website resmi sekolah. Informasi kegiatan, agenda, pengumuman, dan berita terbaru.';
    const logo = themeSettings?.logoUrl || '/favicon.png';
    const baseUrl = window.location.origin;
    const path = location.pathname || '/';
    const url = `${baseUrl}${path}`;

    const routeTitleMap = {
      '/': 'Beranda',
      '/berita': 'Berita',
      '/agenda': 'Agenda',
      '/pengumuman': 'Pengumuman',
      '/ekskul': 'Ekstrakulikuler',
    };

    const pageTitle = routeTitleMap[path] || 'Informasi';
    const title = `${pageTitle} | ${schoolName}`;

    setSeoMeta({
      title,
      description,
      image: logo,
      url,
      type: 'website',
    });

    setJsonLd('org-schema', {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: schoolName,
      url,
      logo,
      telephone: themeSettings?.phone || undefined,
      email: themeSettings?.email || undefined,
      address: themeSettings?.address || undefined,
    });
  }, [location.pathname, themeSettings]);
  
  const isSticky = themeSettings?.stickyHeader !== false;

  return (
    <div 
      className="flex flex-col min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: 'bg-(--bg-site)', 
        color: 'text-(--body-text)' 
      }}
    >
      
      {/* 1. LEMPAR DATA KE HEADER */}
      <Header themeSettings={themeSettings} />
      
      <main className={`flex-1 flex flex-col bg-(--bg-site) ${isSticky ? 'pt-14' : ''}`}>
        <Outlet /> 
      </main>
      
      {/* 2. LEMPAR DATA KE FOOTER */}
      <Footer themeSettings={themeSettings} isBlankTemplate={false} />
      
    </div>
  );
}
