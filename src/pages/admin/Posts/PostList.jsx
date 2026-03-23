import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { List, LayoutGrid, FileText, Plus, Pin, X } from "lucide-react";
import { safeJson } from "../../../utils/http";

const PAGE_SIZE = 10;

const PostList = ({ showToast, posts, setPosts }) => {
  const { openModal } = useModal();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const didFetchRef = useRef(false);

  const selectAllRef = useRef(null);

  const fetchPosts = async () => {
    if (typeof setPosts !== "function") return;
    try {
      const res = await fetch(`/api/posts.php?ts=${Date.now()}`, { cache: "no-store" });
      const data = await safeJson(res);
      if (data.status === "success") {
        setPosts(data.data || []);
      } else {
        showToast?.(data.message || "Gagal memuat data pos.");
      }
    } catch {
      showToast?.("Koneksi server gagal.");
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    if (Array.isArray(posts) && posts.length > 0) return;
    fetchPosts();
  }, []);

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

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredPosts = useMemo(() => {
    if (!search) return posts;

    const q = search.toLowerCase();

    return posts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
    );
  }, [posts, search]);

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(filteredPosts.length / PAGE_SIZE);

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

  /* ---------------- INDETERMINATE CHECKBOX ---------------- */

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < paginatedPosts.length;
    }
  }, [selectedIds, paginatedPosts]);

  /* ---------------- SELECT ALL (CURRENT PAGE) ---------------- */

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginatedPosts.map((p) => p.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  /* ---------------- SELECT ONE ---------------- */

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /* ---------------- BULK ACTION ---------------- */

  const handleBulkAction = () => {
    if (!bulkAction) {
      showToast("Pilih aksi terlebih dahulu.");
      return;
    }

    if (selectedIds.length === 0) {
      showToast("Pilih minimal satu pos.");
      return;
    }

    if (bulkAction === "delete") {
      openModal({
        title: "Hapus Pos Terpilih?",
        content: `Anda yakin ingin menghapus ${selectedIds.length} pos?`,
        confirmText: "Ya, Hapus",
        cancelText: "Batal",
        isDanger: true,
        onConfirm: async () => {
          try {
            await Promise.all(
              selectedIds.map((id) =>
                fetch(`/api/posts.php?id=${id}&ts=${Date.now()}`, {
                  method: "DELETE",
                }).then((res) => safeJson(res).catch(() => ({}))),
              ),
            );

            setPosts(posts.filter((p) => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setBulkAction("");

            showToast("Pos berhasil dihapus.");
          } catch {
            showToast("Koneksi server gagal.");
          }
        },
      });
    }
  };

  /* ---------------- DELETE SINGLE ---------------- */

  const handleDelete = (id) => {
    openModal({
      title: "Hapus Pos?",
      content: "Apakah Anda yakin ingin menghapus pos ini?",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/posts.php?id=${id}`, {
            method: "DELETE",
          });

          const result = await safeJson(res).catch(() => ({}));

          if (result.status === "success") {
            setPosts(posts.filter((p) => p.id !== id));
            showToast("Pos berhasil dihapus.");
          } else {
            showToast(result.message);
          }
        } catch {
          showToast("Koneksi server gagal.");
        }
      },
    });
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-[23px] font-normal text-[#1d2327] flex items-center gap-2">
          <Pin className="w-6 h-6 text-[#2271b1]" />
          Manajemen Artikel
        </h1>
      </div>

      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        {/* BULK ACTION */}
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Bulk Action</option>
            <option value="delete">Hapus</option>
          </select>

          <button
            onClick={handleBulkAction}
            className="border border-gray-300 px-3 py-1 rounded text-sm bg-gray-100 hover:bg-gray-200"
          >
            Terapkan
          </button>

          {selectedIds.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              {selectedIds.length} dipilih
            </span>
          )}
        </div>

        {/* SEARCH + ADD BUTTON */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari pos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />

          <button
            onClick={() => navigate("/admin/posts/edit")}
            className="text-sm border border-[#2271b1] text-[#2271b1] px-3 py-1.5 rounded hover:bg-[#2271b1] hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Tambah Baru
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-x-auto text-[13px]">
        <table className="w-full text-left">
          <thead className="border-b border-gray-300 bg-gray-50">
            <tr>
              <th className="p-3 w-8">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    paginatedPosts.length > 0 &&
                    selectedIds.length === paginatedPosts.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Judul</th>
              <th className="p-3 font-semibold w-32">Penulis</th>
              <th className="p-3 font-semibold w-32">Kategori</th>
              <th className="p-3 font-semibold w-40">Tanggal</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {paginatedPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50 group">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(post.id)}
                    onChange={() => handleSelectOne(post.id)}
                  />
                </td>

                <td className="p-2">
                  <button
                    onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                    className="font-semibold text-[#2271b1] text-[14px] hover:underline"
                  >
                    {post.title}
                  </button>

                  <div className="text-[13px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                      className="text-[#2271b1] hover:underline"
                    >
                      Sunting
                    </button>{" "}
                    |
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-500 hover:underline ml-1"
                    >
                      Hapus
                    </button>
                  </div>
                </td>

                <td className="p-3 text-[#2271b1]">{post.author}</td>
                <td className="p-3 text-gray-600">{post.category}</td>

                <td className="p-3 text-gray-500 leading-tight">
                  <span className="font-medium text-gray-700">
                    {post.status}
                  </span>
                  <br />
                  {post.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-gray-500">
          {filteredPosts.length} pos ditemukan
        </span>

        <div className="flex gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            {"<"}
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const p = i + 1;

            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`border px-3 py-1 rounded ${
                  p === page ? "bg-gray-200 font-semibold" : ""
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="border px-2 py-1 rounded disabled:opacity-40"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostList;

