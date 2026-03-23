import React from "react";
import { useNode } from "@craftjs/core";

const bgMap = {
  "bg-white": "#ffffff",
  "bg-gray-50": "#f9fafb",
  "bg-blue-50": "#eff6ff",
  "bg-green-50": "#f0fdf4",
};
const normalizeBackground = (value) => {
  if (!value) return "#ffffff";
  if (value.startsWith("#")) return value;
  return bgMap[value] || "#ffffff";
};

export const CardBlock = ({
  title = "Judul Card",
  body = "Deskripsi singkat card.",
  background = "#ffffff",
  padding = "p-6",
  align = "left",
  layout = "column",
}) => {
  const { connectors: { connect, drag } } = useNode();
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const bg = normalizeBackground(background);
  const layoutClass = layout === "row" ? "flex flex-row items-start gap-4" : "flex flex-col";

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{ backgroundColor: bg }}
      className={`border border-gray-200 rounded-lg shadow-sm ${padding}`}
    >
      <div className={`${layoutClass} ${alignClass}`}>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className={`text-sm text-gray-600 ${layout === "row" ? "" : "mt-2"} ${layout === "row" ? "flex-1" : ""}`}>
          {body}
        </p>
      </div>
    </div>
  );
};

const CardSettings = () => {
  const { actions: { setProp }, title, body, background, padding, align, layout } = useNode((node) => ({
    title: node.data.props.title,
    body: node.data.props.body,
    background: node.data.props.background,
    padding: node.data.props.padding,
    align: node.data.props.align,
    layout: node.data.props.layout,
  }));
  const backgroundValue = normalizeBackground(background);

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
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Deskripsi</label>
        <textarea
          value={body || ""}
          onChange={(e) => setProp((props) => { props.body = e.target.value; })}
          className="text-xs w-full border border-gray-200 rounded p-2 focus:outline-none"
          rows={3}
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
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
        <label className="text-[10px] font-bold text-gray-400 uppercase">Padding</label>
        <select
          value={padding || "p-6"}
          onChange={(e) => setProp((props) => { props.padding = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="p-4">Kecil</option>
          <option value="p-6">Sedang</option>
          <option value="p-10">Besar</option>
        </select>
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
        <label className="text-[10px] font-bold text-gray-400 uppercase">Layout</label>
        <select
          value={layout || "column"}
          onChange={(e) => setProp((props) => { props.layout = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="column">Grid (Vertikal)</option>
          <option value="row">Row (Horizontal)</option>
        </select>
      </div>
    </div>
  );
};

CardBlock.craft = {
  displayName: "Card",
  props: {
    title: "Judul Card",
    body: "Deskripsi singkat card.",
    background: "#ffffff",
    padding: "p-6",
    align: "left",
    layout: "column",
  },
  related: {
    settings: CardSettings,
  },
};
