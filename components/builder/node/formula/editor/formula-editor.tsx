

import { Button } from "@/components/ui/button";
import { useReactFlow } from "@xyflow/react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { createEditor } from 'slate';
import { Editable, RenderElementProps, Slate, withReact } from 'slate-react';
import { TNodeRefElement } from "./slate/custom-types";
import { Node } from "@/components/builder/node-registry";


// Add this custom editor configuration
const withInlineElements = (editor: any) => {
  const { isInline, isVoid } = editor;

  editor.isInline = (element: any) => {
    return element.type === 'node-ref' || isInline(element);
  };

  editor.isVoid = (element: any) => {
    return element.type === 'node-ref' || isVoid(element);
  };

  return editor;
};


export const FormulaEditor = (
  {
    nodeId,
    value,
    onChange
  }: {
    nodeId: string;
    value: string;
    onChange: (value: string) => void;
  }
) => {

  const { getNodes } = useReactFlow<Node>();

  function getNodeById(id: string) {
    return getNodes().find(node => node.data.id === id);
  }

  const initialValue = getFormulaInitialValue(value);

  const [editor] = useState(() => withInlineElements(withReact(createEditor())))

  const renderElements = useCallback(
    (props: RenderElementProps) => {
      switch (props.element.type) {
        case 'node-ref':
          return <NodeRefElement {...props} />
        default:
          return <DefaultElement {...props} />
      }
    }, [])


  const NodeRefElement = (props: RenderElementProps) => {
    const { element } = props;
    const node = getNodeById((element as TNodeRefElement).nodeId);

    // get the color from the node
    const color = node?.data?.color || 'gray';
    // get the text color for contrast
    const textColor = getTextColorForBackground(color);

    return (
      <span
        {...props.attributes}
        contentEditable={false}
        style={{ userSelect: 'none' }}
      >
        <Button
          className={cn(
            "inline-flex h-6 text-xs font-medium mx-1",
            node ? `bg-[${color}] text-[${textColor}] hover:bg-[${color}]` : "bg-red-500 text-white hover:bg-red-600"
          )}
          variant="outline"
          size="sm"
        >
          {
            // node?.type === 'formula' ? (
            //   getResult(node.data.value, sources)
            // ) : (
            node?.data.id || 'Unknown Node'
            // )
          }
        </Button>
        {props.children}
      </span>
    );
  }

  const DefaultElement = (props: RenderElementProps) => {
    return <p {...props.attributes}>{props.children}</p>
  }

  return (
    <Slate
      editor={editor}
      initialValue={initialValue}
      onChange={(value) => {
        const formulaString = getFormulaStringValue(value);
        onChange(formulaString);
      }}
    >
      <Editable
        renderElement={renderElements}
      />
    </Slate>
  )

}

function getFormulaInitialValue(value: string) {
  let formula = value.trim();

  const children = [];

  // get the node references : uppercase letters and underscores
  const idRegex = /[A-Z_]+/g;
  let match;
  while ((match = idRegex.exec(formula)) !== null) {
    const nodeId = match[0];
    const start = match.index;
    const end = start + nodeId.length;

    // Add text before the match
    if (start > 0) {
      children.push({ text: formula.slice(0, start) });
    }

    // Add the node reference element
    children.push({
      type: 'node-ref',
      nodeId: nodeId,
      children: [{ text: '' }] // Empty text node for the inline element
    });

    // Update the formula to remove the processed part
    formula = formula.slice(end);
    idRegex.lastIndex = 0; // Reset regex index to search again
  }

  return [{
    type: 'paragraph',
    children: children
  }];
}

function getFormulaStringValue(slateValue: any[]): string {
  let formula = '';

  slateValue.forEach((node) => {
    if (node.type === 'paragraph') {
      node.children.forEach((child: any) => {
        if (child.text !== undefined) {
          formula += child.text; // Regular text
        } else if (child.type === 'node-ref') {
          formula += child.nodeId; // Node reference
        }
      });
    }
  });

  return formula;
}

// Add this utility function at the top of the file
function getContrastTextColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Alternative function if you have named colors
function getTextColorForBackground(color: string): string {
  // Handle common named colors
  const colorMap: Record<string, string> = {
    'gray': '#ffffff',
    'grey': '#ffffff',
    'red': '#ffffff',
    'blue': '#ffffff',
    'green': '#ffffff',
    'yellow': '#000000',
    'orange': '#000000',
    'purple': '#ffffff',
    'pink': '#000000',
    'cyan': '#000000',
    'lime': '#000000',
    'white': '#000000',
    'black': '#ffffff',
  };

  // If it's a named color, use the mapping
  if (colorMap[color.toLowerCase()]) {
    return colorMap[color.toLowerCase()];
  }

  // If it's a hex color, calculate contrast
  if (color.startsWith('#')) {
    return getContrastTextColor(color);
  }

  // Default to white for unknown colors
  return '#ffffff';
}
