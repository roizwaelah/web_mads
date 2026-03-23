import React from "react";
import { useNode } from "@craftjs/core";

const sizeMap = {
  "8": "8px",
  "12": "12px",
  "16": "16px",
  "24": "24px",
  "32": "32px",
  "48": "48px",
  "64": "64px",
};

const resolveSize = (size, customSize) => {
  if (customSize && String(customSize).trim()) {
    const value = String(customSize).trim();
    return value.endsWith("px") || value.endsWith("rem") || value.endsWith("%")
      ? value
      : `${value}px`;
  }
  return sizeMap[size] || "16px";
};

export const GapBlock = ({
  direction = "vertical",
  size = "24",
  customSize = "",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();
  const space = resolveSize(size, customSize);
  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      aria-hidden="true"
      style={{
        width: isHorizontal ? space : "100%",
        height: isHorizontal ? "1px" : space,
      }}
      className={isHorizontal ? "shrink-0" : "w-full"}
    />
  );
};

const GapSettings = () => {
  const {
    actions: { setProp },
    direction,
    size,
    customSize,
  } = useNode((node) => ({
    direction: node.data.props.direction,
    size: node.data.props.size,
    customSize: node.data.props.customSize,
  }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Arah</label>
        <select
          value={direction || "vertical"}
          onChange={(e) => setProp((props) => { props.direction = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="vertical">Vertikal</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Ukuran</label>
        <select
          value={size || "24"}
          onChange={(e) => setProp((props) => { props.size = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="8">8px</option>
          <option value="12">12px</option>
          <option value="16">16px</option>
          <option value="24">24px</option>
          <option value="32">32px</option>
          <option value="48">48px</option>
          <option value="64">64px</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Custom (px/rem/%)</label>
        <input
          type="text"
          value={customSize || ""}
          onChange={(e) => setProp((props) => { props.customSize = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          placeholder="contoh: 40px atau 2rem"
        />
      </div>
    </div>
  );
};

GapBlock.craft = {
  displayName: "Gap",
  props: {
    direction: "vertical",
    size: "24",
    customSize: "",
  },
  related: {
    settings: GapSettings,
  },
};
