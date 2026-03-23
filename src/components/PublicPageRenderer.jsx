import React from "react";
import { Editor, Frame } from "@craftjs/core";
import { ContainerBlock } from "./blocks/ContainerBlock";
import { TextBlock } from "./blocks/TextBlock";
import { GuruBlock } from "./blocks/GuruBlock";
import { ButtonBlock } from "./blocks/ButtonBlock";
import { CardBlock } from "./blocks/CardBlock";
import { GapBlock } from "./blocks/GapBlock";
import { LayoutBlock } from "./blocks/LayoutBlock";
import { SectionBlock } from "./blocks/SectionBlock";
import { ImageBlock } from "./blocks/ImageBlock";
import { DividerBlock } from "./blocks/DividerBlock";

const PublicPageRenderer = ({ data }) => {
  // 'data' adalah string JSON yang diambil dari database (kolom content)
  
  if (!data) return <div className="p-10 text-center">Memuat konten...</div>;

  return (
    <div className="public-page-content">
      {/* enabled={false} mematikan fitur drag-and-drop dan editing, 
        sehingga hanya merender HTML/CSS saja.
      */}
      <Editor 
        key={typeof data === "string" ? data.slice(0, 32) : JSON.stringify(data).slice(0, 32)}
        enabled={false} 
        resolver={{
          Container: ContainerBlock,
          Text: TextBlock,
          GuruBlock,
          ButtonBlock,
          CardBlock,
          GapBlock,
          LayoutBlock,
          SectionBlock,
          ImageBlock,
          DividerBlock,
        }}
      >
        <Frame data={data} />
      </Editor>
    </div>
  );
};

export default PublicPageRenderer;
