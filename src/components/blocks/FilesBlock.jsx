import React, { useState, useEffect } from "react";
import { useNode } from "@craftjs/core";
import { FileText, Download, FileArchive, FileSpreadsheet } from "lucide-react";
import { normalizeMediaUrl, safeJson } from "../../utils/http";

export const FilesBlock = ({ title = "Unduhan Dokumen" }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const loadDocs = async () => {
      try {
        const res = await fetch(`/api/documents.php?ts=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await safeJson(res);
        if (json.status === "success") {
          setDocs(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Gagal memuat dokumen:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
    return () => controller.abort();
  }, []);

  const getIcon = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes("xls")) return <FileSpreadsheet className="text-green-600" />;
    if (t?.includes("zip") || t?.includes("rar")) return <FileArchive className="text-orange-500" />;
    return <FileText className="text-blue-600" />;
  };

  const getFileUrl = (rawUrl) => {
    if (!rawUrl) return "#";
    const isAbsolute = /^https?:\/\//i.test(rawUrl);
    if (isAbsolute) return normalizeMediaUrl(rawUrl);
    if (rawUrl.startsWith("/")) return normalizeMediaUrl(rawUrl);
    return normalizeMediaUrl(`/api/${rawUrl}`);
  };

  return (
    <div ref={(ref) => connect(drag(ref))} className="py-8 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          {title}
        </h3>

        {loading ? (
          <p className="text-gray-400 italic text-sm">Memuat daftar berkas...</p>
        ) : docs.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-gray-100 text-center rounded-lg">
            <p className="text-gray-400 text-sm">Belum ada dokumen yang tersedia untuk diunduh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <a
                key={doc.id}
                href={getFileUrl(doc.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-blue-50 transition-colors">
                    {getIcon(doc.type)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-gray-800 truncate text-sm" title={doc.name}>
                      {doc.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                      {doc.type} - {doc.created_at}
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
