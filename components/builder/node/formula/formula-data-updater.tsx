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



  return (
    <div className="flex flex-col gap-2 p-2 border rounded shadow-sm">
      <div className="flex-1 flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}:</label>
      </div>
      <input
        type="string"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-1 rounded w-full"
      />
    </div>
  );
}
