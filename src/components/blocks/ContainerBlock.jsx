import { useNode } from "@craftjs/core";
import React from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const bgMap = {
  "bg-white": "#ffffff",
  "bg-gray-50": "#f9fafb",
  "bg-gray-100": "#f3f4f6",
  "bg-blue-50": "#eff6ff",
  "bg-green-50": "#f0fdf4",
};
const normalizePadding = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.startsWith("p-")) {
      const num = Number(value.replace("p-", ""));
      if (!Number.isNaN(num)) return num * 4;
    }
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return 16;
};
const normalizeBackground = (value) => {
  if (!value) return "#f3f4f6";
  if (value.startsWith("#")) return value;
  return bgMap[value] || "#f3f4f6";
};

export const ContainerBlock = ({ background, padding, children }) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const pad = clamp(normalizePadding(padding), 0, 160);
  const bg = normalizeBackground(background);
  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{ padding: `${pad}px`, backgroundColor: bg }}
      className="min-h-[50px] transition-all border rounded-lg border-gray-100"
    >
      {children}
    </div>
  );
};

const ContainerSettings = () => {
  const {
    actions: { setProp },
    background,
    padding,
  } = useNode((node) => ({
    background: node.data.props.background,
    padding: node.data.props.padding,
  }));
  const paddingValue = clamp(normalizePadding(padding), 0, 160);
  const backgroundValue = normalizeBackground(background);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">
          Background
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={backgroundValue}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="h-7 w-9 rounded border border-gray-200"
          />
          <input
            type="text"
            value={backgroundValue}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">
          Padding
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="160"
            step="2"
            value={paddingValue}
            onChange={(e) => setProp((props) => { props.padding = Number(e.target.value); })}
            className="w-full"
          />
          <input
            type="number"
            min="0"
            max="160"
            value={paddingValue}
            onChange={(e) => setProp((props) => { props.padding = Number(e.target.value); })}
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
};

ContainerBlock.craft = {
  displayName: "Container",
  props: {
    background: "#f3f4f6",
    padding: 16,
  },
  related: {
    settings: ContainerSettings,
  },
};
