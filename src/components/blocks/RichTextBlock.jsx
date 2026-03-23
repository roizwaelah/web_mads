import React from "react";
import { useEditor, useNode } from "@craftjs/core";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

const quillModules = {
  toolbar: [
    [{ font: [] }, { header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }, { direction: "rtl" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

export const RichTextBlock = ({
  content = "<p>Tulis konten di sini...</p>",
  minHeight = 240,
  background = "#ffffff",
  padding = "p-4",
}) => {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const {
    connectors: { connect, drag },
    actions: { setProp },
  } = useNode();

  const heightValue = clamp(Number(minHeight) || 240, 120, 1200);
  const pad = clamp(normalizePadding(padding), 0, 160);

  if (!enabled) {
    return (
      <div
        ref={(ref) => connect(drag(ref))}
        style={{ padding: `${pad}px`, backgroundColor: background }}
        className="richtext-viewer"
      >
        <style>{`
          .richtext-viewer .ql-editor .ql-align-center { text-align: center !important; }
          .richtext-viewer .ql-editor .ql-align-right { text-align: right !important; }
          .richtext-viewer .ql-editor .ql-align-justify { text-align: justify !important; }
          .richtext-viewer .ql-editor { line-height: 1.5; }
          .richtext-viewer .ql-editor p { margin: 0 0 2em; }
          .richtext-viewer .ql-editor p:last-child { margin-bottom: 0; }
          .richtext-viewer img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
          .richtext-viewer .ql-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 1.5rem; }
          .richtext-viewer .ql-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 1.5rem; }
          .richtext-viewer .ql-editor li { list-style: inherit; margin: 0.25rem 0; }
          .richtext-viewer .ql-editor strong { font-weight: 700; }
          .richtext-viewer .ql-editor em { font-style: italic; }
        `}</style>
        <div className="ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  return (
    <div
      ref={(ref) => connect(drag(ref))}
      style={{ backgroundColor: background }}
      className={padding}
    >
      <style>{`
        .richtext-editor .ql-container { min-height: ${heightValue}px; font-size: 14px; font-family: inherit; }
        .richtext-editor .ql-toolbar { border-top: none; border-left: none; border-right: none; background-color: #f9fafb; }
        .richtext-editor .ql-container.ql-snow { border: none; }
        .richtext-editor .ql-editor { line-height: 1.5; }
        .richtext-editor .ql-editor p { margin: 0 0 2em; }
        .richtext-editor .ql-editor p:last-child { margin-bottom: 0; }
        .richtext-editor .ql-editor img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 4px; }
      `}</style>
      <ReactQuill
        theme="snow"
        value={content}
        onChange={(value) => setProp((props) => { props.content = value; })}
        modules={quillModules}
        className="richtext-editor"
        placeholder="Tulis konten di sini..."
      />
    </div>
  );
};

const RichTextSettings = () => {
  const {
    actions: { setProp },
    content,
    minHeight,
    background,
    padding,
  } = useNode((node) => ({
    content: node.data.props.content,
    minHeight: node.data.props.minHeight,
    background: node.data.props.background,
    padding: node.data.props.padding,
  }));

  const paddingValue = clamp(normalizePadding(padding), 0, 160);
  const heightValue = clamp(Number(minHeight) || 240, 120, 1200);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Tinggi Minimum</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="120"
            max="1200"
            step="10"
            value={heightValue}
            onChange={(e) => setProp((props) => { props.minHeight = Number(e.target.value); })}
            className="w-full"
          />
          <input
            type="number"
            min="120"
            max="1200"
            value={heightValue}
            onChange={(e) => setProp((props) => { props.minHeight = Number(e.target.value); })}
            className="w-20 text-xs border border-gray-200 rounded px-2 py-1"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Background</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={background || "#ffffff"}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="h-7 w-9 rounded border border-gray-200"
          />
          <input
            type="text"
            value={background || "#ffffff"}
            onChange={(e) => setProp((props) => { props.background = e.target.value; })}
            className="text-xs w-full border-b border-gray-200 py-1 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Padding</label>
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
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase">Konten HTML</label>
        <textarea
          value={content || ""}
          onChange={(e) => setProp((props) => { props.content = e.target.value; })}
          className="text-xs w-full border border-gray-200 rounded p-2 focus:outline-none"
          rows={4}
        />
      </div>
    </div>
  );
};

RichTextBlock.craft = {
  displayName: "Rich Text",
  props: {
    content: "<p>Tulis konten di sini...</p>",
    minHeight: 240,
    background: "#ffffff",
    padding: "p-4",
  },
  related: {
    settings: RichTextSettings,
  },
};
