import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, FileText, Calendar, Clock, ArrowRight, Search, UserCircle } from 'lucide-react';
import { setJsonLd } from '../../utils/seo';
import { normalizeMediaUrl, safeJson } from '../../utils/http';

export default function DaftarBerita({ posts = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [listView, setListView] = useState('grid');
  const [remotePosts, setRemotePosts] = useState([]);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts.php?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        setRemotePosts(data.data || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (Array.isArray(posts) && posts.length > 0) return;
    const controller = new AbortController();
    const loadPosts = async () => {
      try {
        const res = await fetch(`/api/posts.php?ts=${Date.now()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await safeJson(res);
        if (data.status === "success") {
          setRemotePosts(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadPosts();
    return () => controller.abort();
  }, [posts]);

  useEffect(() => {
    const onPostsUpdated = () => fetchPosts();
    const onStorage = (event) => {
      if (event.key === "posts-updated-at") fetchPosts();
    };
    const onFocus = () => fetchPosts();
    window.addEventListener("posts-updated", onPostsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("posts-updated", onPostsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const postSource = posts.length > 0 ? posts : remotePosts;
  const visiblePosts = postSource.filter((post) => {
    const status = (post.status || "").toString().toLowerCase();
    return !status || status === "publish";
  });
  const filteredPosts = visiblePosts.filter((post) =>
    (post.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (!filteredPosts.length) return;
    const baseUrl = window.location.origin;
    const items = filteredPosts.slice(0, 20).map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/berita/${post.id}`,
      name: post.title,
    }));
    setJsonLd('berita-list-schema', {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items,
    });
  }, [filteredPosts]);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full animate-[fadeIn_0.3s_ease-in]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-(--body-text) border-b-4 border-(--primary) inline-block pb-2">
            Berita Madrasah
          </h1>
          <p className="text-gray-600 mt-2">
            Arsip warta seputar dunia pendidikan dan kebudayaan.
          </p>
        </div>

        <div className="w-full md:w-72 relative">
          <input
            type="text"
            placeholder="Cari berita..."
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-8">
          {/* HERO ARTICLE */}
          {filteredPosts[0] && (
            <article
              onClick={() => navigate(`/berita/${filteredPosts[0].id}`)}
              className="group cursor-pointer mb-10"
            >
              <div className="aspect-video overflow-hidden rounded-xl mb-4">
                <img
                  src={normalizeMediaUrl(filteredPosts[0].image || filteredPosts[0].img || 'https://placehold.co/800x600')}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>

              <span className="text-xs font-bold uppercase text-emerald-600">
                {filteredPosts[0].category}
              </span>

              <h2 className="text-2xl font-bold mt-2 group-hover:text-emerald-600 transition">
                {filteredPosts[0].title}
              </h2>

              <div className="text-sm text-gray-500 mt-2 flex gap-3">
                <span>{filteredPosts[0].author}</span>
                <span>-</span>
                <span>{filteredPosts[0].date}</span>
              </div>
            </article>
          )}

          {/* GRID ARTIKEL */}
          <div className="grid sm:grid-cols-2 gap-8">
            {filteredPosts.slice(1).map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/berita/${post.id}`)}
                className="group cursor-pointer"
              >
                <div className="aspect-4/3 overflow-hidden rounded-lg mb-3">
                <img
                  src={normalizeMediaUrl(post.image || post.img || 'https://placehold.co/400x300')}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                </div>

                <span className="text-xs uppercase font-semibold text-emerald-600">
                  {post.category}
                </span>

                <h3 className="font-bold text-lg leading-snug mt-1 line-clamp-2 group-hover:text-emerald-600 transition">
                  {post.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {post.date}
                </p>
              </article>
            ))}
          </div>
        </div>


        {/* SIDEBAR */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24">
            <h3 className="text-xl font-bold mb-6 border-b pb-2">
              Berita Populer
            </h3>

            <div className="flex flex-col gap-6">

              {filteredPosts.slice(0,5).map((post, i) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/berita/${post.id}`)}
                  className="flex gap-4 cursor-pointer group"
                >
                  <div className="text-3xl font-bold text-gray-300 w-8">
                    {i + 1}
                  </div>

                  <div>
                    <h4 className="font-semibold leading-snug line-clamp-2 group-hover:text-emerald-600 transition">
                      {post.title}
                    </h4>

                    <p className="text-xs text-gray-500 mt-1">
                      {post.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* LOAD MORE */}
      <div className="flex justify-center mt-16">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
          Muat Berita Lainnya
        </button>
      </div>
    </main>
  );
}
