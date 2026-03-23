import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeMediaUrl, safeJson } from '../../utils/http';

export default function SectionBerita({
  latestPost,
  otherPosts = [],
  readArticle,
  goToArticles,
}) {
  const navigate = useNavigate();
  const [remotePosts, setRemotePosts] = useState([]);

  useEffect(() => {
    if (latestPost || otherPosts.length > 0) return;
    try {
      const cached = localStorage.getItem("public-posts-cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setRemotePosts(parsed);
      }
    } catch {
      // ignore
    }
  }, [latestPost, otherPosts]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/posts.php?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await safeJson(res);
      if (data.status === 'success') {
        const items = data.data || [];
        setRemotePosts(items);
        try {
          localStorage.setItem("public-posts-cache", JSON.stringify(items));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (latestPost || otherPosts.length > 0) return;
    const controller = new AbortController();
    const loadPosts = async () => {
      try {
        const res = await fetch(`/api/posts.php?ts=${Date.now()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await safeJson(res);
        if (data.status === 'success') {
          setRemotePosts(data.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadPosts();
    return () => controller.abort();
  }, [latestPost, otherPosts]);

  useEffect(() => {
    const onPostsUpdated = () => fetchPosts();
    const onStorage = (event) => {
      if (event.key === "posts-updated-at") fetchPosts();
    };
    const onFocus = () => fetchPosts();
    const intervalId = setInterval(fetchPosts, 60000);
    window.addEventListener("posts-updated", onPostsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("posts-updated", onPostsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const postSource =
    latestPost || otherPosts.length > 0
      ? [latestPost, ...otherPosts].filter(Boolean)
      : remotePosts;

  const publishedPosts = (postSource || []).filter((post) => {
    const status = (post.status || '').toString().toLowerCase();
    return !status || status === 'publish';
  });

  const derivedLatest = latestPost || publishedPosts[0];
  const derivedOthers = otherPosts.length > 0 ? otherPosts : publishedPosts.slice(1, 4);

  if (!derivedLatest && derivedOthers.length === 0) return null;

  const handleReadArticle = (post) => {
    if (readArticle) return readArticle(post);
    if (post?.id) return navigate(`/berita/${post.id}`);
  };

  const handleGoToArticles = () => {
    if (goToArticles) return goToArticles();
    navigate('/berita');
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Berita <span className="text-[#008e49]">Terbaru</span>
          </h2>

          <button
            onClick={handleGoToArticles}
            className="text-[#008e49] font-semibold flex items-center gap-2 hover:gap-3 transition-all"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {derivedLatest && (
            <div
              className="lg:col-span-7 group cursor-pointer"
              onClick={() => handleReadArticle(derivedLatest)}
            >
              <div className="relative aspect-video overflow-hidden rounded-xl mb-4">
                <img
                  src={normalizeMediaUrl(
                    derivedLatest.img ||
                      derivedLatest.image ||
                      'https://placehold.co/800x600',
                  )}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  alt={derivedLatest.title}
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent"></div>

                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="bg-[#008e49] text-white text-[11px] font-bold px-3 py-1 rounded uppercase">
                    Sorotan
                  </span>

                  <h3 className="text-2xl md:text-3xl font-bold mt-3 leading-tight">
                    {derivedLatest.title}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="lg:col-span-5 flex flex-col divide-y">
            {derivedOthers.map((post) => (
              <article
                key={post.id || Math.random()}
                onClick={() => handleReadArticle(post)}
                className="flex gap-4 py-4 group cursor-pointer"
              >
                <div className="w-32 shrink-0 aspect-4/3 overflow-hidden rounded">
                  <img
                    src={normalizeMediaUrl(
                      post.img || post.image || 'https://placehold.co/400x300',
                    )}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    alt={post.title}
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#008e49] transition-colors">
                    {post.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                      <UserCircle className="w-4 h-4" />
                      {post.author || '-'}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.date || '-'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
