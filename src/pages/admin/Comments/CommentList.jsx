import { useMemo, useRef, useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Disetujui" },
  { key: "spam", label: "Spam" },
  { key: "trash", label: "Trash" },
];

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Disetujui",
  spam: "Spam",
  trash: "Trash",
};

const STATUS_CLASS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  spam: "bg-red-50 text-red-700 border-red-200",
  trash: "bg-gray-100 text-gray-600 border-gray-200",
};

const CommentList = ({ comments = [], setComments = () => {}, showToast }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const selectAllRef = useRef(null);

  const statusCounts = useMemo(
    () =>
      comments.reduce(
        (acc, item) => {
          const key = item.status || "pending";
          acc[key] = (acc[key] || 0) + 1;
          acc.all += 1;
          return acc;
        },
        { all: 0, pending: 0, approved: 0, spam: 0, trash: 0 },
      ),
    [comments],
  );

  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return comments;
    return comments.filter((c) => c.status === statusFilter);
  }, [comments, statusFilter]);

  const filteredComments = useMemo(() => {
    if (!search) return statusFiltered;
    const q = search.toLowerCase();
    return statusFiltered.filter(
      (c) =>
        c.author?.toLowerCase().includes(q) ||
        c.content?.toLowerCase().includes(q) ||
        c.postTitle?.toLowerCase().includes(q),
    );
  }, [statusFiltered, search]);

  const threadedComments = useMemo(() => {
    const byParent = new Map();
    filteredComments.forEach((item) => {
      const key = item.parent_id ? String(item.parent_id) : "root";
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(item);
    });

    const output = [];
    const walk = (parentKey, depth) => {
      const items = byParent.get(parentKey) || [];
      items.forEach((item) => {
        output.push({ ...item, _depth: depth });
        walk(String(item.id), depth + 1);
      });
    };

    walk("root", 0);
    return output;
  }, [filteredComments]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < threadedComments.length;
    }
  }, [selectedIds, threadedComments.length]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(threadedComments.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const applyStatus = async (ids, status) => {
    try {
      let results = [];
      if (ids.length > 1) {
        const res = await fetch("/api/comments.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "batch_update", ids, status }),
        });
        const data = await res.json().catch(() => ({ status: "error" }));
        results = [data];
      } else {
        results = await Promise.all(
          ids.map((id) =>
            fetch("/api/comments.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, status }),
            }).then((res) => res.json().catch(() => ({ status: "error" }))),
          ),
        );
      }

      if (results.some((item) => item.status !== "success")) {
        showToast?.("Sebagian komentar gagal diperbarui.");
        return;
      }

      setComments((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, status } : item,
        ),
      );
      setSelectedIds([]);
      showToast?.("Status komentar berhasil diperbarui.");
    } catch {
      showToast?.("Koneksi server gagal.");
    }
  };

  const handleBulkAction = () => {
    if (!bulkAction) {
      showToast?.("Pilih aksi terlebih dahulu.");
      return;
    }
    if (selectedIds.length === 0) {
      showToast?.("Pilih minimal satu komentar.");
      return;
    }

    const nextStatus =
      bulkAction === "approve"
        ? "approved"
        : bulkAction === "spam"
          ? "spam"
          : "trash";

    applyStatus(selectedIds, nextStatus);
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease-in]">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-[24px] font-normal text-[#1d2327] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#2271b1]" />
          Manajemen Komentar
        </h1>
        <span className="text-[12px] text-gray-500">
          Moderasi komentar pada artikel dan halaman.
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Bulk Action</option>
            <option value="approve">Setujui</option>
            <option value="spam">Spam</option>
            <option value="trash">Trash</option>
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

        <input
          type="text"
          placeholder="Cari komentar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[12px] mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`border px-3 py-1 rounded-full transition ${
              statusFilter === tab.key
                ? "bg-[#2271b1] text-white border-[#2271b1]"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {tab.label} ({statusCounts[tab.key] ?? 0})
          </button>
        ))}
      </div>

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
                    threadedComments.length > 0 &&
                    selectedIds.length === threadedComments.length
                  }
                />
              </th>
              <th className="p-3 font-semibold">Penulis</th>
              <th className="p-3 font-semibold">Komentar</th>
              <th className="p-3 font-semibold w-48">Tautan</th>
              <th className="p-3 font-semibold w-28">Status</th>
              <th className="p-3 font-semibold w-40">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {threadedComments.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Belum ada komentar untuk dimoderasi.
                </td>
              </tr>
            ) : (
              threadedComments.map((comment) => (
                <tr key={comment.id} className="hover:bg-gray-50 group">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(comment.id)}
                      onChange={() => handleSelectOne(comment.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">
                      {comment.author}
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {comment.email}
                    </div>
                  </td>
                  <td className="p-3 text-gray-700">
                    <div
                      className={
                        comment._depth > 0 ? "border-l border-gray-200" : ""
                      }
                      style={{
                        paddingLeft:
                          comment._depth > 0 ? comment._depth * 16 : 0,
                      }}
                    >
                      <div className="line-clamp-2">{comment.content}</div>
                      {comment._depth > 0 && (
                        <div className="text-[11px] text-gray-400 mt-1">
                          Balasan komentar
                        </div>
                      )}
                    </div>
                    <div className="text-[12px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => applyStatus([comment.id], "approved")}
                        className="text-emerald-600 hover:underline"
                      >
                        Setujui
                      </button>{" "}
                      |
                      <button
                        onClick={() => applyStatus([comment.id], "spam")}
                        className="text-red-500 hover:underline ml-1"
                      >
                        Spam
                      </button>{" "}
                      |
                      <button
                        onClick={() => applyStatus([comment.id], "trash")}
                        className="text-gray-500 hover:underline ml-1"
                      >
                        Trash
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-[#2271b1]">
                    {comment.postTitle || "â€”"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                          STATUS_CLASS[comment.status] ||
                          "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUS_LABEL[comment.status] || "Pending"}
                      </span>
                      {comment.status === "pending" && (
                        <button
                          onClick={() => applyStatus([comment.id], "approved")}
                          className="text-[11px] text-emerald-600 font-semibold hover:underline"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{comment.date || "â€”"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommentList;

