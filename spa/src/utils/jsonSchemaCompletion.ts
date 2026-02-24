import type { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { syntaxTree } from '@codemirror/language';
import type { SchemaObject, OpenApiSpec } from '../openapi';
import { resolveSchema } from './schema';
import { uuidv7 } from './uuidv7';

/**
 * CodeMirror completion source that suggests JSON property names based on a JSON Schema.
 */
export function jsonSchemaComplete(
  context: CompletionContext,
  schema: SchemaObject | null | undefined,
  spec: OpenApiSpec | null | undefined,
): CompletionResult | null {
  if (!schema || !spec) return null;

  const { state, pos } = context;
  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);

  const cursorInfo = getJsonPathAtCursor(state, pos, node);
  if (!cursorInfo) return null;

  const subSchema = getSchemaAtPath(schema, spec, cursorInfo.path);
  if (!subSchema?.properties) return null;

  const existing = cursorInfo.objectNode
    ? collectExistingKeys(state, cursorInfo.objectNode)
    : new Set<string>();

  const required = new Set(subSchema.required ?? []);
  const options: Completion[] = [];

  for (const [key, propSchema] of Object.entries(subSchema.properties)) {
    if (existing.has(key)) continue;

    const resolved = resolveSchema(propSchema, spec);
    if (resolved.readOnly) continue;

    const isRequired = required.has(key);
    options.push({
      label: key,
      type: 'property',
      detail: formatSchemaType(resolved) + (isRequired ? ' (required)' : ''),
      info: resolved.description,
      boost: isRequired ? 1 : 0,
      validFor: /^[a-zA-Z0-9_-]*$/,
    });
  }

  if (options.length === 0) return null;

  return {
    from: cursorInfo.from,
    to: cursorInfo.to,
    options,
  };
}

export interface FormatValueInfo {
  /** The schema format (e.g. 'uuid', 'date', 'date-time', 'time') */
  format: 'uuid' | 'date' | 'date-time' | 'time';
  /** Start of the string content (after opening quote) */
  from: number;
  /** End of the string content (before closing quote) */
  to: number;
}

/**
 * Checks if the cursor is inside a property value string whose schema has a known format.
 * Shared by value completions and the tooltip extension.
 */
export function getFormatAtCursor(
  state: EditorState,
  pos: number,
  schema: SchemaObject | null | undefined,
  spec: OpenApiSpec | null | undefined,
): FormatValueInfo | null {
  if (!schema || !spec) return null;

  const tree = syntaxTree(state);
  const node = tree.resolveInner(pos, -1);

  const info = getValueInfoAtCursor(state, pos, node);
  if (!info) return null;

  const parentSchema = getSchemaAtPath(schema, spec, info.path);
  if (!parentSchema?.properties) return null;

  const propSchema = parentSchema.properties[info.propertyName];
  if (!propSchema) return null;

  const resolved = mergeComposite(resolveSchema(propSchema, spec), spec);
  const format = resolved.format;

  if (format !== 'uuid' && format !== 'date' && format !== 'date-time' && format !== 'time') return null;

  return { format, from: info.from, to: info.to };
}

/**
 * CodeMirror completion source that suggests values for properties with special formats.
 */
export function jsonSchemaValueComplete(
  context: CompletionContext,
  schema: SchemaObject | null | undefined,
  spec: OpenApiSpec | null | undefined,
): CompletionResult | null {
  const info = getFormatAtCursor(context.state, context.pos, schema, spec);
  if (!info) return null;

  const options: Completion[] = [];

  switch (info.format) {
    case 'uuid':
      options.push({
        label: 'Generate UUIDv7',
        type: 'text',
        detail: 'uuid',
        apply: (view, _completion, from, to) => {
          view.dispatch({ changes: { from, to, insert: uuidv7() } });
        },
      });
      break;
    case 'date': {
      const today = new Date().toISOString().slice(0, 10);
      options.push({
        label: `Today (${today})`,
        type: 'text',
        detail: 'date',
        apply: (view, _completion, from, to) => {
          view.dispatch({ changes: { from, to, insert: today } });
        },
      });
      break;
    }
    case 'date-time': {
      const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
      options.push({
        label: `Now (${now})`,
        type: 'text',
        detail: 'date-time',
        apply: (view, _completion, from, to) => {
          view.dispatch({ changes: { from, to, insert: now } });
        },
      });
      break;
    }
    case 'time': {
      const pad = (n: number) => String(n).padStart(2, '0');
      const d = new Date();
      const now = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      options.push({
        label: `Now (${now})`,
        type: 'text',
        detail: 'time',
        apply: (view, _completion, from, to) => {
          view.dispatch({ changes: { from, to, insert: now } });
        },
      });
      break;
    }
  }

  if (options.length === 0) return null;

  return {
    from: info.from,
    to: info.to,
    options,
  };
}

interface ValueInfo {
  /** The property name this value belongs to */
  propertyName: string;
  /** JSON path to the parent object */
  path: string[];
  /** Start of the string content (after opening quote) */
  from: number;
  /** End of the string content (before closing quote) */
  to: number;
}

/**
 * Detects when the cursor is inside a property value string (not a property name).
 * A value string is a String node that is NOT the first child of a Property.
 */
function getValueInfoAtCursor(
  state: EditorState,
  pos: number,
  node: SyntaxNode,
): ValueInfo | null {
  // Must be inside a String node
  if (node.name !== 'String') return null;

  const parent = node.parent;
  if (!parent || parent.name !== 'Property') return null;

  // Must NOT be the property name (first child)
  if (parent.firstChild?.from === node.from) return null;

  // Get the property name from the first child
  const nameNode = parent.firstChild;
  if (!nameNode || (nameNode.name !== 'PropertyName' && nameNode.name !== 'String')) return null;

  const propertyName = state.sliceDoc(nameNode.from, nameNode.to).replace(/^"|"$/g, '');

  const content = state.sliceDoc(node.from, node.to);
  const innerFrom = node.from + (content.startsWith('"') ? 1 : 0);
  const innerTo = node.to - (content.endsWith('"') ? 1 : 0);

  // Cursor must be within the string
  if (pos < innerFrom || pos > innerTo) return null;

  const objectNode = findParentObject(parent);

  return {
    propertyName,
    path: buildJsonPath(state, objectNode),
    from: innerFrom,
    to: innerTo,
  };
}

interface CursorInfo {
  /** JSON path segments from root to the current object */
  path: string[];
  /** Start of the text being completed */
  from: number;
  /** End of the text being completed */
  to: number;
  /** The Object node containing the cursor */
  objectNode: SyntaxNode | null;
}

/**
 * Determines whether the cursor is in a property-name position inside a JSON object,
 * and returns the JSON path from root to the current object.
 */
function getJsonPathAtCursor(
  state: EditorState,
  pos: number,
  node: SyntaxNode,
): CursorInfo | null {
  const name = node.name;

  // Case 1: Inside a PropertyName node (user is typing between quotes)
  if (name === 'PropertyName') {
    const content = state.sliceDoc(node.from, node.to);
    // Strip quotes for the from/to range
    const innerFrom = node.from + (content.startsWith('"') ? 1 : 0);
    const innerTo = node.to - (content.endsWith('"') ? 1 : 0);
    const objectNode = findParentObject(node);
    return {
      path: buildJsonPath(state, objectNode),
      from: innerFrom,
      to: innerTo,
      objectNode,
    };
  }

  // Case 2: Inside a String that is the key part of a Property
  if (name === 'String') {
    const parent = node.parent;
    if (parent?.name === 'Property' && parent.firstChild?.from === node.from) {
      const content = state.sliceDoc(node.from, node.to);
      const innerFrom = node.from + (content.startsWith('"') ? 1 : 0);
      const innerTo = node.to - (content.endsWith('"') ? 1 : 0);
      const objectNode = findParentObject(parent);
      return {
        path: buildJsonPath(state, objectNode),
        from: innerFrom,
        to: innerTo,
        objectNode,
      };
    }
  }

  // Case 3 & 4: After { or , inside an Object, or error nodes inside Object
  if (name === 'Object' || name === '{' || name === '⚠') {
    const objectNode = name === 'Object' ? node : findParentObject(node);
    if (!objectNode) return null;

    // Verify cursor position is plausible for a property name
    const textBefore = state.sliceDoc(objectNode.from, pos);
    const trimmed = textBefore.trimEnd();
    const lastChar = trimmed[trimmed.length - 1];
    if (lastChar !== '{' && lastChar !== ',' && lastChar !== undefined) {
      // Could be after a colon or value — not a key position
      // But allow if user just typed a quote
      if (lastChar !== '"') return null;
    }

    return {
      path: buildJsonPath(state, objectNode),
      from: pos,
      to: pos,
      objectNode,
    };
  }

  return null;
}

/**
 * Walks up the tree to find the nearest Object ancestor.
 */
function findParentObject(node: SyntaxNode): SyntaxNode | null {
  let current: SyntaxNode | null = node.parent;
  while (current) {
    if (current.name === 'Object') return current;
    current = current.parent;
  }
  return null;
}

/**
 * Builds the JSON path from root to the given Object node.
 * Each segment is a property name that leads from the root object down.
 */
function buildJsonPath(state: EditorState, objectNode: SyntaxNode | null): string[] {
  const segments: string[] = [];
  let current = objectNode;

  while (current) {
    const parent = current.parent;
    if (!parent) break;

    if (parent.name === 'Property') {
      // This object is the value of a property — get the property name
      const nameNode = parent.firstChild;
      if (nameNode && (nameNode.name === 'PropertyName' || nameNode.name === 'String')) {
        const raw = state.sliceDoc(nameNode.from, nameNode.to);
        segments.unshift(raw.replace(/^"|"$/g, ''));
      }
    }

    current = parent;
  }

  return segments;
}

/**
 * Navigates the schema following JSON path segments, resolving $ref and
 * merging allOf/oneOf/anyOf at each step.
 */
function getSchemaAtPath(
  rootSchema: SchemaObject,
  spec: OpenApiSpec,
  path: string[],
): SchemaObject | null {
  let current = mergeComposite(rootSchema, spec);

  for (const segment of path) {
    const prop = current.properties?.[segment];
    if (!prop) return null;
    current = mergeComposite(resolveSchema(prop, spec), spec);
  }

  return current;
}

/**
 * Merges allOf schemas and collects oneOf/anyOf variant properties into a single schema.
 */
function mergeComposite(schema: SchemaObject, spec: OpenApiSpec): SchemaObject {
  const resolved = resolveSchema(schema, spec);

  if (resolved.allOf) {
    let merged: SchemaObject = { ...resolved };
    delete merged.allOf;
    const mergedProperties: Record<string, SchemaObject> = { ...merged.properties };
    const mergedRequired: string[] = [...(merged.required ?? [])];

    for (const sub of resolved.allOf) {
      const resolvedSub = mergeComposite(sub, spec);
      if (resolvedSub.properties) {
        Object.assign(mergedProperties, resolvedSub.properties);
      }
      if (resolvedSub.required) {
        mergedRequired.push(...resolvedSub.required);
      }
      // Inherit scalar fields (type, format, etc.) from sub-schemas
      if (resolvedSub.type && !merged.type) merged = { ...merged, type: resolvedSub.type };
      if (resolvedSub.format && !merged.format) merged = { ...merged, format: resolvedSub.format };
    }

    merged = { ...merged, properties: mergedProperties };
    if (mergedRequired.length > 0) {
      merged.required = [...new Set(mergedRequired)];
    }
    return merged;
  }

  if (resolved.oneOf ?? resolved.anyOf) {
    const variants = resolved.oneOf ?? resolved.anyOf ?? [];
    const unionProperties: Record<string, SchemaObject> = { ...resolved.properties };

    for (const variant of variants) {
      const resolvedVariant = mergeComposite(variant, spec);
      if (resolvedVariant.properties) {
        Object.assign(unionProperties, resolvedVariant.properties);
      }
    }

    if (Object.keys(unionProperties).length > 0) {
      return { ...resolved, properties: unionProperties };
    }
  }

  return resolved;
}

/**
 * Collects already-used property keys in the given Object node.
 */
function collectExistingKeys(state: EditorState, objectNode: SyntaxNode): Set<string> {
  const keys = new Set<string>();
  let child = objectNode.firstChild;

  while (child) {
    if (child.name === 'Property') {
      const nameNode = child.firstChild;
      if (nameNode && (nameNode.name === 'PropertyName' || nameNode.name === 'String')) {
        const raw = state.sliceDoc(nameNode.from, nameNode.to);
        keys.add(raw.replace(/^"|"$/g, ''));
      }
    }
    child = child.nextSibling;
  }

  return keys;
}

/**
 * Formats a schema type for display in completion detail.
 */
function formatSchemaType(schema: SchemaObject): string {
  const type = Array.isArray(schema.type)
    ? schema.type.find((t: string) => t !== 'null') ?? schema.type[0]
    : schema.type;

  if (!type) {
    if (schema.oneOf) return 'oneOf';
    if (schema.anyOf) return 'anyOf';
    if (schema.allOf) return 'allOf';
    return 'unknown';
  }

  if (schema.format) return `${type} (${schema.format})`;
  if (schema.enum) return `${type} (enum)`;

  return type ?? 'unknown';
}
