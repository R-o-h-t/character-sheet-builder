// TypeScript users only add this code
import { BaseEditor, Descendant } from 'slate'
import { ReactEditor } from 'slate-react'


export type TNodeRefElement = {
  type: 'node-ref';
  nodeId: string;
  children: [{ text: '' }];
};
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor
    Element: TNodeRefElement
  }
}
