import React from "react";
import { useNode } from "@craftjs/core";
import { normalizeMediaUrl } from "../../utils/http";

export const ImageBlock = ({
  src = "",
  alt = "",
  caption = "",
  align = "center",
  width = "full",
  rounded = "md",
}) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  const widthClass =
    width === "sm"
      ? "max-w-sm"
      : width === "md"
        ? "max-w-md"
        : width === "lg"
          ? "max-w-2xl"
          : width === "xl"
            ? "max-w-4xl"
            : "w-full";

  const roundedClass =
    rounded === "none"
      ? "rounded-none"
      : rounded === "sm"
        ? "rounded-sm"
        : rounded === "lg"
          ? "rounded-lg"
          : rounded === "xl"
            ? "rounded-xl"
            : "rounded-md";

  const resolvedSrc = src ? normalizeMediaUrl(src) : "https://placehold.co/800x500";

  return (
    <div ref={(ref) => connect(drag(ref))} className={`flex flex-col ${alignClass}`}>
      <div className={widthClass}>
        <img
          src={resolvedSrc}
          alt={alt || "Gambar"}
          className={`w-full h-auto ${roundedClass}`}
          loading="lazy"
          decoding="async"
        />
      </div>
      {caption && (
        <p className="text-xs text-gray-500 mt-2">{caption}</p>
      )}
    </div>
  );
};

const ImageSettings = () => {
  const {
    actions: { setProp },
    src,
    alt,
    caption,
    align,
    width,
    rounded,
  } = useNode((node) => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    caption: node.data.props.caption,
    align: node.data.props.align,
    width: node.data.props.width,
    rounded: node.data.props.rounded,
  }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Image URL</label>
        <input
          type="text"
          value={src || ""}
          onChange={(e) => setProp((props) => { props.src = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          placeholder="/uploads/..."
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Alt Text</label>
        <input
          type="text"
          value={alt || ""}
          onChange={(e) => setProp((props) => { props.alt = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Caption</label>
        <input
          type="text"
          value={caption || ""}
          onChange={(e) => setProp((props) => { props.caption = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
        />
      </div>
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
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Width</label>
        <select
          value={width || "full"}
          onChange={(e) => setProp((props) => { props.width = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="full">Full</option>
          <option value="xl">XL</option>
          <option value="lg">Large</option>
          <option value="md">Medium</option>
          <option value="sm">Small</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Rounded</label>
        <select
          value={rounded || "md"}
          onChange={(e) => setProp((props) => { props.rounded = e.target.value; })}
          className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none bg-transparent"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">XL</option>
        </select>
      </div>
    </div>
  );
};

ImageBlock.craft = {
  displayName: "Image",
  props: {
    src: "",
    alt: "",
    caption: "",
    align: "center",
    width: "full",
    rounded: "md",
  },
  related: {
    settings: ImageSettings,
  },
};
