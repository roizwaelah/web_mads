import { useEditor, useNode } from "@craftjs/core";
import React, { useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const fontSizeMap = {
  "text-sm": 14,
  "text-base": 16,
  "text-lg": 18,
  "text-2xl": 24,
  "text-4xl": 36,
};
const colorMap = {
  "text-black": "#111827",
  "text-gray-600": "#4b5563",
  "text-gray-400": "#9ca3af",
  "text-blue-600": "#2563eb",
  "text-green-600": "#16a34a",
};
const normalizeFontSize = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (fontSizeMap[value]) return fontSizeMap[value];
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return 16;
};
const normalizeColor = (value) => {
  if (!value) return "#111827";
  if (value.startsWith("#")) return value;
  return colorMap[value] || "#111827";
};

export const TextBlock = ({
  text,
  fontSize,
  color,
  align = "left",
  style = "body",
}) => {
  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();
  const [editable, setEditable] = useState(false);
  const size = clamp(normalizeFontSize(fontSize), 10, 96);
  const textColor = normalizeColor(color);
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  const styleClass =
    style === "heading"
      ? "font-bold tracking-tight"
      : style === "subtitle"
        ? "font-semibold text-gray-700"
        : style === "muted"
          ? "text-gray-500"
          : "font-normal";

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      onClick={() => enabled && setEditable(true)}
    >
      {enabled && editable ? (
        <input
          className={`w-full bg-transparent border-b border-blue-500 outline-none ${alignClass}`}
          value={text}
          onChange={(e) => setProp((props) => { props.text = e.target.value; })}
          onBlur={() => setEditable(false)}
        />
      ) : (
        <p
          style={{ fontSize: `${size}px`, color: textColor }}
          className={`${alignClass} ${styleClass}`}
        >
          {text}
        </p>
      )}
    </div>
  );
};

const TextSettings = () => {
  const {
    actions: { setProp },
    text,
    fontSize,
    color,
    align,
    style,
  } = useNode((node) => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    color: node.data.props.color,
    align: node.data.props.align,
    style: node.data.props.style,
  }));
  const fontSizeValue = clamp(normalizeFontSize(fontSize), 10, 96);
  const colorValue = normalizeColor(color);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Teks</label>
        <input
          type="text"
          value={text || ""}
          onChange={(e) => setProp((props) => { props.text = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Ukuran</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="10"
            max="96"
            step="1"
            value={fontSizeValue}
            onChange={(e) => setProp((props) => { props.fontSize = Number(e.target.value); })}
            className="w-full"
          />
          <input
            type="number"
            min="10"
            max="96"
            value={fontSizeValue}
            onChange={(e) => setProp((props) => { props.fontSize = Number(e.target.value); })}
            className="w-16 text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Warna</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colorValue}
            onChange={(e) => setProp((props) => { props.color = e.target.value; })}
            className="h-7 w-9 rounded border border-gray-200"
          />
          <input
            type="text"
            value={colorValue}
            onChange={(e) => setProp((props) => { props.color = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Align</label>
        <select
          value={align || "left"}
          onChange={(e) => setProp((props) => { props.align = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Gaya</label>
        <select
          value={style || "body"}
          onChange={(e) => setProp((props) => { props.style = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="body">Body</option>
          <option value="heading">Heading</option>
          <option value="subtitle">Subtitle</option>
          <option value="muted">Muted</option>
        </select>
      </div>
    </div>
  );
};

TextBlock.craft = {
  displayName: "Text",
  props: {
    text: "Teks baru di sini...",
    fontSize: 16,
    color: "#111827",
    align: "left",
    style: "body",
  },
  related: {
    settings: TextSettings,
  },
};
