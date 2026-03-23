import React from "react";
import { useNode } from "@craftjs/core";

export const ButtonBlock = ({ text = "Klik Saya", href = "#", variant = "primary", align = "left" }) => {
  const { connectors: { connect, drag } } = useNode();
  const base =
    variant === "outline"
      ? "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50"
      : variant === "dark"
        ? "bg-gray-900 text-white hover:bg-black"
        : "bg-blue-600 text-white hover:bg-blue-700";

  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div ref={(ref) => connect(drag(ref))} className={alignClass}>
      <a
        href={href}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition ${base}`}
      >
        {text}
      </a>
    </div>
  );
};

const ButtonSettings = () => {
  const { actions: { setProp }, text, href, variant, align } = useNode((node) => ({
    text: node.data.props.text,
    href: node.data.props.href,
    variant: node.data.props.variant,
    align: node.data.props.align,
  }));

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
        <label className="text-[10px] font-bold text-gray-400 uppercase">Link</label>
        <input
          type="text"
          value={href || ""}
          onChange={(e) => setProp((props) => { props.href = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Gaya</label>
        <select
          value={variant || "primary"}
          onChange={(e) => setProp((props) => { props.variant = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="primary">Primary</option>
          <option value="outline">Outline</option>
          <option value="dark">Dark</option>
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
    </div>
  );
};

ButtonBlock.craft = {
  displayName: "Button",
  props: {
    text: "Klik Saya",
    href: "#",
    variant: "primary",
    align: "left",
  },
  related: {
    settings: ButtonSettings,
  },
};

