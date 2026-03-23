import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {ArrowLeft, Clock, UserCircle} from 'lucide-react';
import { setJsonLd, setSeoMeta } from '../../utils/seo';
import { normalizeMediaUrl, safeJson } from '../../utils/http';

export default function DetailBerita({ posts = [] }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [remotePost, setRemotePost] = useState(null);
  const [postLoading, setPostLoading] = useState(posts.length === 0);
  const [comments, setComments] = useState([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [formState, setFormState] = useState({
    author: "",
    email: "",
    url: "",
    content: "",
  });
  const [replyTo, setReplyTo] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  
  const goToArticles = () => {
    navigate("/berita");
  };

  useEffect(() => {
    if (Array.isArray(posts) && posts.length > 0) return;
    if (!id) return;
    try {
      const cachedList = localStorage.getItem("public-posts-cache");
      if (cachedList) {
        const parsed = JSON.parse(cachedList);
        if (Array.isArray(parsed)) {
          const found = parsed.find((item) => item?.id?.toString() === id);
          if (found) setRemotePost(found);
        }
      }
    } catch {
      // ignore
    }
  }, [posts, id]);

  const fetchPost = async (signal) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/posts.php?id=${id}&ts=${Date.now()}`, {
        signal,
        cache: "no-store",
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        const payload = data.data ?? data;
        const item = Array.isArray(payload) ? payload[0] : payload;
        setRemotePost(item || null);
        try {
          const cached = localStorage.getItem("public-posts-cache");
          const list = cached ? JSON.parse(cached) : [];
          const next = Array.isArray(list) ? list.slice() : [];
          if (item?.id) {
            const index = next.findIndex((entry) => entry?.id === item.id);
            if (index >= 0) {
              next[index] = item;
            } else {
              next.unshift(item);
            }
          }
          localStorage.setItem("public-posts-cache", JSON.stringify(next));
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      if (!signal || !signal.aborted) {
        setPostLoading(false);
      }
    }
  };

  useEffect(() => {
    if (Array.isArray(posts) && posts.length > 0) {
      setPostLoading(false);
      return;
    }
    if (!id) return;
    const controller = new AbortController();
    fetchPost(controller.signal);
    return () => controller.abort();
  }, [posts, id]);

  useEffect(() => {
    if (Array.isArray(posts) && posts.length > 0) return;
    const onPostsUpdated = () => fetchPost();
    const onStorage = (event) => {
      if (event.key === "posts-updated-at") fetchPost();
    };
    const onFocus = () => fetchPost();
    const intervalId = setInterval(fetchPost, 60000);
    window.addEventListener("posts-updated", onPostsUpdated);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("posts-updated", onPostsUpdated);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [posts, id]);

  const postSource = posts.length > 0 ? posts : remotePost ? [remotePost] : [];
  const post = postSource.find(p => p?.id?.toString() === id);
  const relatedPosts = post
    ? postSource.filter((item) => item.id !== post.id).slice(0, 3)
    : [];

  const shareFacebook = () => {
  const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const shareTwitter = () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const shareWhatsapp = () => {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`;
    window.open(shareUrl, "_blank");
  };

  useEffect(() => {
    if (!post?.id) return;
    const controller = new AbortController();
    const loadComments = async () => {
      setCommentLoading(true);
      setCommentError("");
      try {
        const res = await fetch(
          `/api/comments.php?post_id=${post.id}&status=approved`,
          { signal: controller.signal },
        );
        const data = await safeJson(res);
        if (data.status === "success") {
          setComments(data.data || []);
        } else {
          setCommentError(data.message || "Gagal memuat komentar.");
        }
      } catch {
        if (!controller.signal.aborted) {
          setCommentError("Koneksi server gagal.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setCommentLoading(false);
        }
      }
    };

    loadComments();

    return () => controller.abort();
  }, [post?.id]);

  useEffect(() => {
    if (!post?.id) return;
    const baseUrl = window.location.origin;
    const url = window.location.href || `${baseUrl}/berita/${post.id}`;
    const title = post.title || 'Berita Sekolah';
    const plain = (post.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const description = plain.slice(0, 160) || 'Berita terbaru sekolah.';
    const image = normalizeMediaUrl(post.image || post.img || '/favicon.png');

    setSeoMeta({
      title: `${title} | Berita`,
      description,
      image,
      url,
      type: 'article',
    });

    setJsonLd(`article-${post.id}`, {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: title,
      image: [image],
      datePublished: post.date || undefined,
      author: post.author || 'Admin',
      mainEntityOfPage: url,
    });
  }, [post?.id]);

  const commentsByParent = useMemo(() => {
    const map = new Map();
    comments.forEach((item) => {
      const key = item.parent_id ? String(item.parent_id) : "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [comments]);

  const renderComments = (parentKey = "root", depth = 0) => {
    const items = commentsByParent.get(parentKey) || [];
    if (items.length === 0) return null;

    return (
      <div className={depth > 0 ? "pl-6 border-l border-gray-100 mt-4" : "space-y-4"}>
        {items.map((comment) => (
          <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span className="font-semibold text-gray-800">{comment.author}</span>
              <span>{comment.date || "-"}</span>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-line">{comment.content}</p>
            <button
              onClick={() => setReplyTo(comment)}
              className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
            >
              Balas
            </button>
            {renderComments(String(comment.id), depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const handleFormChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage("");

    if (!formState.author.trim() || !formState.content.trim()) {
      setSubmitMessage("Nama dan komentar wajib diisi.");
      return;
    }

    try {
      const res = await fetch("/api/comments.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: formState.author,
          email: formState.email,
          url: formState.url,
          content: formState.content,
          post_id: post.id,
          parent_id: replyTo?.id || null,
        }),
      });
      const data = await safeJson(res);
      if (data.status === "success") {
        setSubmitMessage("Komentar berhasil dikirim dan menunggu moderasi.");
        setFormState({ author: "", email: "", url: "", content: "" });
        setReplyTo(null);
      } else {
        setSubmitMessage(data.message || "Gagal mengirim komentar.");
      }
    } catch {
      setSubmitMessage("Koneksi server gagal.");
    }
  };

  if (postLoading) return <div className="p-20 text-center">Memuat artikel...</div>;
  if (!post) return <div className="p-20 text-center">Artikel tidak ditemukan.</div>;

  const url = window.location.href;
  const title = post.title;

  return (
    <main className="max-w-4xl mx-auto px-1 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2">
        <span onClick={() => navigate('/')} className="cursor-pointer hover:text-emerald-600">Beranda</span>
        <span>/</span>
        <span onClick={goToArticles} className="cursor-pointer hover:text-emerald-600">Berita</span>
        {post.category && (
          <>
            <span>/</span>
            <span className="text-gray-700">{post.category}</span>
          </>
        )}
      </nav>

      {/* Tombol Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mb-6 hover:gap-3 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </button>

      {/* Kategori */}
      {post.category && (
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 px-3 py-1 rounded mb-3">
          {post.category}
        </span>
      )}

      {/* Judul */}
      <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 mb-4">
        {post.title}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
        <span className="flex items-center gap-1">
          <UserCircle className="w-4 h-4"/>
          {post.author || "Admin"}
        </span>

        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4"/>
          {post.date || "-"}
        </span>

        <span className="text-gray-400">-</span>

        <span>
          {Math.ceil((post.content?.length || 0) / 800)} menit baca
        </span>
      </div>

      {/* Share Button */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-gray-500">Bagikan:</span>

        <button
          onClick={shareFacebook}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          Facebook
        </button>

        <button
          onClick={shareTwitter}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          Twitter
        </button>

        <button
          onClick={shareWhatsapp}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          WhatsApp
        </button>
      </div>

      {/* Gambar Artikel */}
      <div className="mb-10">
        <img
          src={normalizeMediaUrl(post.image || post.img || 'https://placehold.co/800x500')}
          className="w-full md:w-[80%] mx-auto rounded-2xl mb-8"
          alt={post.title}
        />
      </div>

      {/* Konten Artikel */}
      <article
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-emerald-600"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Artikel Terkait */}
      {relatedPosts?.length > 0 && (
        <section className="mt-16 border-t pt-10">
          <h3 className="text-2xl font-bold mb-6">
            Artikel <span className="text-emerald-600">Terkait</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.map((item) => (
              <article
                key={item.id}
                onClick={() => navigate(`/berita/${item.id}`)}
                className="group cursor-pointer"
              >

                <div className="aspect-4/3 overflow-hidden rounded-lg mb-3">
                  <img
                    src={normalizeMediaUrl(item.image || item.img || 'https://placehold.co/400x300')}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    alt={item.title}
                  />
                </div>

                <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition">
                  {item.title}
                </h4>

                <p className="text-xs text-gray-500 mt-1">
                  {item.date || "-"}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Komentar */}
      <section className="mt-16 border-t pt-10">
        <h3 className="text-2xl font-bold mb-6">
          Komentar <span className="text-emerald-600">Pembaca</span>
        </h3>

        {commentLoading && (
          <div className="text-sm text-gray-500">Memuat komentar...</div>
        )}
        {commentError && (
          <div className="text-sm text-red-500">{commentError}</div>
        )}

        {!commentLoading && !commentError && comments.length === 0 && (
          <div className="text-sm text-gray-500">
            Belum ada komentar. Jadilah yang pertama.
          </div>
        )}

        {!commentLoading && !commentError && comments.length > 0 && (
          <div className="mt-4 space-y-4">{renderComments()}</div>
        )}

        <div className="mt-10 bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Tinggalkan Komentar
          </h4>
          {replyTo && (
            <div className="mb-4 text-sm text-gray-600">
              Membalas komentar dari <span className="font-semibold">{replyTo.author}</span>.{" "}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-emerald-600 font-semibold hover:underline ml-1"
              >
                Batalkan
              </button>
            </div>
          )}
          <form onSubmit={handleCommentSubmit} className="space-y-3 text-sm">
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nama Anda*"
                value={formState.author}
                onChange={handleFormChange("author")}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
              <input
                type="email"
                placeholder="Email (opsional)"
                value={formState.email}
                onChange={handleFormChange("email")}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <input
              type="url"
              placeholder="Website (opsional)"
              value={formState.url}
              onChange={handleFormChange("url")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-600"
            />
            <textarea
              rows="4"
              placeholder="Tulis komentar Anda*"
              value={formState.content}
              onChange={handleFormChange("content")}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-600 resize-none"
            />
            {submitMessage && (
              <div className="text-sm text-gray-600">{submitMessage}</div>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
            >
              Kirim Komentar
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}



