import React, { useState, useEffect } from "react";
import { useNode } from "@craftjs/core";
import { User } from "lucide-react";
import { normalizeMediaUrl, safeJson } from "../../utils/http";

const decodeHtml = (value) => {
  if (!value) return "";
  return value
    .toString()
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
};

export const GuruBlock = ({ title = "Daftar Pendidik" }) => {
  const { connectors: { connect, drag } } = useNode();
  const [gurus, setGurus] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const loadGurus = async () => {
      try {
        const res = await fetch(`/api/gurus.php?ts=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await safeJson(res);
        if (json.status === "success") {
          setGurus(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Gagal memuat data guru:", err);
        }
      }
    };
    loadGurus();
    return () => controller.abort();
  }, []);

  return (
    <div ref={(ref) => connect(drag(ref))} className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {title ? (
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {title}
          </h2>
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {gurus.map((guru, index) => (
            <div key={guru.id ?? index} className="flex flex-col items-center text-center group">
              <div className="w-48 h-48 bg-gray-100 rounded-full overflow-hidden mb-5 shadow-sm flex items-center justify-center text-gray-400 border-4 border-white transition-colors duration-300">
                {guru.img ? (
                  <img src={normalizeMediaUrl(guru.img)} alt={guru.name || "Guru"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-20 h-20" />
                )}
              </div>
              <h3 className="font-bold text-lg">{decodeHtml(guru.name)}</h3>
              <p className="text-(--accent) text-sm mt-1">{decodeHtml(guru.role)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GuruBlockSettings = () => {
  const { actions: { setProp }, title } = useNode((node) => ({
    title: node.data.props.title,
  }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Judul</label>
        <input
          type="text"
          value={title || ""}
          onChange={(e) => setProp((props) => { props.title = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
        />
      </div>
    </div>
  );
};

GuruBlock.craft = {
  displayName: "Daftar Guru",
  props: {
    title: "Daftar Pendidik",
  },
  related: {
    settings: GuruBlockSettings,
  },
};

