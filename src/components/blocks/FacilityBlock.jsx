import React, { useState, useEffect } from "react";
import { useNode } from "@craftjs/core";
import { Image as ImageIcon } from "lucide-react";
import { normalizeMediaUrl, safeJson } from "../../utils/http";

export const FacilityBlock = ({ title = "Fasilitas" }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const [data, setData] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    const loadFacilities = async () => {
      try {
        const res = await fetch(`/api/facilities.php?ts=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await safeJson(res);
        if (json.status === "success") {
          setData(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("Gagal memuat fasilitas:", err);
        }
      }
    };
    loadFacilities();
    return () => controller.abort();
  }, []);

  return (
    <div ref={(ref) => connect(drag(ref))} className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {title ? (
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            {title}
          </h2>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden shadow-lg group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="relative h-56 overflow-hidden">
                {item.image ? (
                  <img
                    src={normalizeMediaUrl(item.image)}
                    alt={item.name || "Fasilitas"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
