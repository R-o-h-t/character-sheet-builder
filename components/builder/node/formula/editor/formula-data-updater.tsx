import { Toggle } from "@/components/ui/toggle";
import { Radical } from "lucide-react";
import { FormulaEditor } from "./formula-editor";
import { useState } from "react";
// import { FormulaEditor } from "./bkup.formula-editor";

export function NodeDataFormulaUpdater({
  nodeId,
  value,
  label,
  onChange
}: {
  nodeId: string;
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {


  const [showFormulaEditor, setShowFormulaEditor] = useState(false);

  return (
    <div className="flex flex-col gap-2 p-2 border rounded shadow-sm">
      <div className="flex-1 flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}:</label>
        {/* toggle formula mod / text mode */}
        {/* isformula => 1st char is "="*/}
        <Toggle
          pressed={showFormulaEditor}
          onPressedChange={(checked) => {
            setShowFormulaEditor(checked);
          }}
          className="mr-2"
        >
          <Radical className="size-4" />
        </Toggle>
      </div>

      {!showFormulaEditor ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border p-1 rounded w-full"
        />
      ) : (

        <FormulaEditor
          nodeId={nodeId}
          value={value}
          onChange={onChange}
        />
      )}

    </div>
  );
}
