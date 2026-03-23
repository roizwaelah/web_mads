import React from "react";
import { useNode } from "@craftjs/core";

const bgMap = {
  "bg-white": "#ffffff",
  "bg-gray-50": "#f9fafb",
  "bg-blue-50": "#eff6ff",
  "bg-green-50": "#f0fdf4",
};

const normalizeBackground = (value) => {
  if (!value) return "transparent";
  if (value === "transparent") return "transparent";
  if (value.startsWith("#")) return value;
  return bgMap[value] || "transparent";
};

const maxWidthClass = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-7xl",
  full: "max-w-none",
};

export const SectionBlock = ({
  anchorId = "",
  background = "transparent",
  padding = "py-10",
  fullWidth = false,
  maxWidth = "2xl",
  align = "center",
  children,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const bg = normalizeBackground(background);
  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  return (
    <section
      ref={(ref) => connect(drag(ref))}
      id={anchorId || undefined}
      style={{ backgroundColor: bg }}
      className={`w-full ${padding}`}
    >
      <div
        className={`${fullWidth ? "px-0" : "px-4 sm:px-6 lg:px-8"} ${maxWidthClass[maxWidth] || maxWidthClass["2xl"]} mx-auto flex flex-col ${alignClass}`}
      >
        {children}
      </div>
    </section>
  );
};

const SectionSettings = () => {
  const {
    actions: { setProp },
    anchorId,
    background,
    padding,
    fullWidth,
    maxWidth,
    align,
  } = useNode((node) => ({
    anchorId: node.data.props.anchorId,
    background: node.data.props.background,
    padding: node.data.props.padding,
    fullWidth: node.data.props.fullWidth,
    maxWidth: node.data.props.maxWidth,
    align: node.data.props.align,
  }));

  const bgValue = normalizeBackground(background || "transparent");

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Anchor ID</label>
        <input
          type="text"
          value={anchorId || ""}
          onChange={(e) => setProp((props) => { props.anchorId = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          placeholder="contoh: profil-sekolah"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={bgValue === "transparent" ? "#ffffff" : bgValue}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="h-7 w-9 rounded border border-gray-200"
          />
          <input
            type="text"
            value={background || "transparent"}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
            placeholder="transparent atau #ffffff"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Padding</label>
        <select
          value={padding || "py-10"}
          onChange={(e) => setProp((props) => { props.padding = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="py-6">Kecil</option>
          <option value="py-10">Sedang</option>
          <option value="py-16">Besar</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(fullWidth)}
          onChange={(e) => setProp((props) => { props.fullWidth = e.target.checked; })}
          className="h-4 w-4"
        />
        <span className="text-xs text-gray-600">Full width (tanpa max-width)</span>
      </div>
      {!fullWidth && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Max Width</label>
          <select
            value={maxWidth || "2xl"}
            onChange={(e) => setProp((props) => { props.maxWidth = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">XL</option>
            <option value="2xl">2XL</option>
            <option value="full">Full</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Align</label>
        <select
          value={align || "center"}
          onChange={(e) => setProp((props) => { props.align = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
};

SectionBlock.craft = {
  displayName: "Section",
  props: {
    anchorId: "",
    background: "transparent",
    padding: "py-10",
    fullWidth: false,
    maxWidth: "2xl",
    align: "center",
  },
  related: {
    settings: SectionSettings,
  },
};
