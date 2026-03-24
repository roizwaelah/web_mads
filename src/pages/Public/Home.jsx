import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../../components/public/SectionHero';
import Stats from '../../components/public/SectionStats';
import SectionPengumuman from '../../components/public/SectionPengumuman';
import SectionAgenda from '../../components/public/SectionAgenda';
import SectionBerita from '../../components/public/SectionBerita';
import { slugifyTitle } from '../../utils/content';

export default function Home({ themeSettings, posts = [], announcements = [], agendas = [], gurus = [], prestasi = [], fasilitas = [], ekskul = [] }) {
  const navigate = useNavigate();

  // Filter Publish
  const publishedPosts = posts.filter(p => p.status === 'Publish');
  const latestPost = publishedPosts.length > 0 ? publishedPosts[0] : null;
  const otherPosts = publishedPosts.slice(1, 4);
  const prestasiPosts = publishedPosts.filter(p => p.category === 'Prestasi');

  return (
    <main id="main-content" className="flex-1 animate-[fadeIn_0.3s_ease-in]">
      <Hero themeSettings={themeSettings} />
      <Stats
        gurus={gurus}
        prestasi={prestasiPosts}
        fasilitas={fasilitas}
        ekskul={ekskul}
        sambutanKepala={themeSettings?.sambutanKepala}
        sambutanFoto={themeSettings?.sambutanFoto}
        sambutanLinkSlug={themeSettings?.sambutanLinkSlug}
      />
      
      {/* Meneruskan fungsi navigate ke section agar tombol "Lihat Semua" berfungsi */}
      <SectionPengumuman
        announcements={announcements}
        goToAnnouncements={(item) => navigate(item ? `/pengumuman/${item.slug || slugifyTitle(item.title)}` : '/pengumuman')}
      />
      <SectionAgenda agenda={agendas} goToAgenda={() => navigate('/agenda')} />
      <SectionBerita
        latestPost={latestPost}
        otherPosts={otherPosts}
        readArticle={(post) => navigate(`/berita/${post.slug || slugifyTitle(post.title)}`)}
        goToArticles={() => navigate('/berita')}
      />
    </main>
  );
}
