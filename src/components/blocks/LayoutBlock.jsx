import React from "react";
import { useNode } from "@craftjs/core";

const columnMap = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const gapMap = {
  "2": "gap-2",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
  "10": "gap-10",
};

export const LayoutBlock = ({
  layout = "grid",
  columns = 3,
  gap = "6",
  align = "start",
  padding = "p-2",
  background = "bg-transparent",
  children,
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const isGrid = layout === "grid";
  const gridCols = columnMap[columns] || columnMap[3];
  const gapClass = gapMap[gap] || "gap-6";
  const alignClass =
    align === "center" ? "items-center" : align === "end" ? "items-end" : "items-start";

  const layoutClass = isGrid
    ? `grid grid-cols-1 ${gridCols} ${gapClass}`
    : `flex flex-col ${gapClass}`;

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      className={`${layoutClass} ${alignClass} ${padding} ${background}`}
    >
      {children}
    </div>
  );
};

const LayoutSettings = () => {
  const {
    actions: { setProp },
    layout,
    columns,
    gap,
    align,
    padding,
  } = useNode((node) => ({
    layout: node.data.props.layout,
    columns: node.data.props.columns,
    gap: node.data.props.gap,
    align: node.data.props.align,
    padding: node.data.props.padding,
  }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Layout</label>
        <select
          value={layout || "grid"}
          onChange={(e) => setProp((props) => { props.layout = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="grid">Grid</option>
          <option value="flex-col">Flex Column</option>
        </select>
      </div>
      {layout === "grid" && (
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase">Kolom</label>
          <select
            value={columns || 3}
            onChange={(e) => setProp((props) => { props.columns = Number(e.target.value); })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
      )}
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Gap</label>
        <select
          value={gap || "6"}
          onChange={(e) => setProp((props) => { props.gap = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="2">8px</option>
          <option value="4">16px</option>
          <option value="6">24px</option>
          <option value="8">32px</option>
          <option value="10">40px</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Align</label>
        <select
          value={align || "start"}
          onChange={(e) => setProp((props) => { props.align = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="start">Start</option>
          <option value="center">Center</option>
          <option value="end">End</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Padding</label>
        <select
          value={padding || "p-2"}
          onChange={(e) => setProp((props) => { props.padding = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="p-0">0</option>
          <option value="p-2">Kecil</option>
          <option value="p-4">Sedang</option>
          <option value="p-6">Besar</option>
        </select>
      </div>
    </div>
  );
};

LayoutBlock.craft = {
  displayName: "Layout",
  props: {
    layout: "grid",
    columns: 3,
    gap: "6",
    align: "start",
    padding: "p-2",
    background: "bg-transparent",
  },
  related: {
    settings: LayoutSettings,
  },
};
