import TextNode from './text-node';
import NumberNode from './number-node';
import IdNode from './id-node';
import TextConcatNode from './text-concat-node';

// Brick components - foundational building blocks
import FormulaBrick from './bricks/formula-brick';
import ValueBrick from './bricks/value-brick';

// Composite nodes - built from combining bricks
import PlusComposite from './composite/plus-composite';
import MinusComposite from './composite/minus-composite';
import MultiplyComposite from './composite/multiply-composite';
import DivideComposite from './composite/divide-composite';

// Internal nodes for building composites
import ObjectNode from './internal/object-node';
import InputNode from './internal/input-node';
import PropertyNode from './internal/property-node';
import ReferenceNode from './internal/reference-node';
import CompositeNode from './composite-node';
import OutputNode from './internal/output-node';
import ObjectDecomposeNode from './object-decompose-node';

export default [
  // Brick components - foundational building blocks
  FormulaBrick,
  ValueBrick,

  // Composite nodes - built from combining bricks
  PlusComposite,
  MinusComposite,
  MultiplyComposite,
  DivideComposite,

  // Internal nodes for building composites
  InputNode,
  PropertyNode,
  ReferenceNode,
  OutputNode,
  CompositeNode,
  ObjectNode,
  ObjectDecomposeNode,

  // Basic nodes
  TextNode,
  NumberNode,
  IdNode,
  TextConcatNode,
] as const;
