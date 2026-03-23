import React from "react";
import { useNode } from "@craftjs/core";

export const DividerBlock = ({
  color = "#e5e7eb",
  thickness = 1,
  width = "full",
  margin = "my-6",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const widthClass =
    width === "half"
      ? "w-1/2"
      : width === "third"
        ? "w-1/3"
        : width === "quarter"
          ? "w-1/4"
          : "w-full";

  return (
    <div ref={(ref) => connect(drag(ref))} className={`flex justify-center ${margin}`}>
      <div
        className={widthClass}
        style={{ borderTop: `${thickness}px solid ${color}` }}
      />
    </div>
  );
};

const DividerSettings = () => {
  const {
    actions: { setProp },
    color,
    thickness,
    width,
    margin,
  } = useNode((node) => ({
    color: node.data.props.color,
    thickness: node.data.props.thickness,
    width: node.data.props.width,
    margin: node.data.props.margin,
  }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color || "#e5e7eb"}
            onChange={(e) => setProp((props) => { props.color = e.target.value; })}
            className="h-7 w-9 rounded border border-gray-200"
          />
          <input
            type="text"
            value={color || "#e5e7eb"}
            onChange={(e) => setProp((props) => { props.color = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Thickness</label>
        <select
          value={thickness || 1}
          onChange={(e) => setProp((props) => { props.thickness = Number(e.target.value); })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value={1}>1px</option>
          <option value={2}>2px</option>
          <option value={3}>3px</option>
          <option value={4}>4px</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Width</label>
        <select
          value={width || "full"}
          onChange={(e) => setProp((props) => { props.width = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="full">Full</option>
          <option value="half">1/2</option>
          <option value="third">1/3</option>
          <option value="quarter">1/4</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Margin</label>
        <select
          value={margin || "my-6"}
          onChange={(e) => setProp((props) => { props.margin = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="my-2">Kecil</option>
          <option value="my-4">Sedang</option>
          <option value="my-6">Besar</option>
          <option value="my-10">Extra</option>
        </select>
      </div>
    </div>
  );
};

DividerBlock.craft = {
  displayName: "Divider",
  props: {
    color: "#e5e7eb",
    thickness: 1,
    width: "full",
    margin: "my-6",
  },
  related: {
    settings: DividerSettings,
  },
};
