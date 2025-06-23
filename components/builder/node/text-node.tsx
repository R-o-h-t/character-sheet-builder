import { memo, useState } from "react";
import { Resizable } from "./node-resizer";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNodeData } from "@/lib/hooks/useNodeData";


function TextNode({
  data: { id },
  selected,
}: {
  data: {
    id: string;
  };
  selected: boolean;
}) {

  const { data, update } = useNodeData(id);

  return (
    <Resizable selected={selected} options={{ isResizable: true, }} >
      <Card className={
        cn("w-full h-full p-4",
          data.alignmentX === "left" ? "text-left" :
            data.alignmentX === "center" ? "text-center" :
              data.alignmentX === "right" ? "text-right" : "",
          data.alignmentY === "top" ? "justify-start" :
            data.alignmentY === "center" ? "justify-center" :
              data.alignmentY === "bottom" ? "justify-end" : "",
        )}>
        <div className="text-sm text-gray-700">
          {data.modifiable ? (
            <input
              type="text"
              value={data.text}
              onChange={(e) => update({ text: e.target.value })}
              className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
            />
          ) : (
            data.text
          )}
        </div>
      </Card>
    </Resizable>
  );
}


export const definition = {
  type: 'text',
  label: 'Text Node',
  defaultData: {
    text: 'New Text',
    alignmentX: 'center',
    alignmentY: 'center',
    modifiable: true,
  },
  component: memo(TextNode),
};
