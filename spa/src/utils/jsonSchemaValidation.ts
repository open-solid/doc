import type { Extension } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { linter, forEachDiagnostic, type Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import type { SyntaxNode } from '@lezer/common';
import type { MutableRefObject } from 'react';
import type { SchemaObject, OpenApiSpec } from '../openapi';
import { resolveSchema } from './schema';
import { mergeComposite, collectExistingKeys } from './jsonSchemaCompletion';

export interface ValidationResult {
  valid: boolean;
  errorCount: number;
  errors: { line: number; message: string }[];
}

/**
 * Creates a CodeMirror extension that validates JSON against a JSON Schema,
 * showing inline error markers via the linter API.
 */
export function jsonSchemaLintExtension(
  schemaRef: MutableRefObject<SchemaObject | null | undefined>,
  specRef: MutableRefObject<OpenApiSpec | null | undefined>,
): Extension {
  return linter(
    (view: EditorView) => {
      const schema = schemaRef.current;
      const spec = specRef.current;
      if (!schema || !spec) return [];

      return jsonSchemaLintSource(view.state, schema, spec);
    },
    { delay: 300 },
  );
}

/**
 * Extracts the current validation result from the editor state by reading lint diagnostics.
 */
export function extractValidationResult(state: EditorState): ValidationResult {
  const errors: { line: number; message: string }[] = [];

  forEachDiagnostic(state, (d) => {
    if (d.severity === 'error') {
      const line = state.doc.lineAt(d.from).number;
      errors.push({ line, message: d.message });
    }
  });

  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    errors,
  };
}

// -- Lint source -----------------------------------------------------------

function jsonSchemaLintSource(
  state: EditorState,
  schema: SchemaObject,
  spec: OpenApiSpec,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const tree = syntaxTree(state);
  const doc = state.doc.toString();

  // 1. Check for syntax errors in the lezer tree
  let hasSyntaxError = false;
  tree.iterate({
    enter(node) {
      if (node.name === '\u26A0') {
        hasSyntaxError = true;
        diagnostics.push({
          from: node.from,
          to: Math.max(node.to, node.from + 1),
          severity: 'error',
          message: 'Syntax error',
        });
      }
    },
  });

  // If there are syntax errors, the tree is unreliable for schema validation
  if (hasSyntaxError) return diagnostics;

  // 2. Parse the JSON document
  let parsed: unknown;
  try {
    parsed = JSON.parse(doc);
  } catch {
    // JSON.parse failed but lezer didn't flag it - should be rare
    return diagnostics;
  }

  // 3. Find the root value node in the syntax tree
  const topNode = tree.topNode;
  const rootValue = topNode.firstChild;
  if (!rootValue) return diagnostics;

  // 4. Validate against the schema
  const resolved = mergeComposite(schema, spec);
  validateValue(state, rootValue, parsed, resolved, spec, diagnostics);

  return diagnostics;
}

// -- Recursive validator ---------------------------------------------------

function validateValue(
  state: EditorState,
  node: SyntaxNode,
  value: unknown,
  schema: SchemaObject,
  spec: OpenApiSpec,
  diagnostics: Diagnostic[],
): void {
  const resolved = mergeComposite(resolveSchema(schema, spec), spec);

  // Nullable check
  if (value === null) {
    if (resolved.nullable) return;
    const typeArr = Array.isArray(resolved.type) ? resolved.type : [];
    if (typeArr.includes('null')) return;
    if (resolved.type && !typeArr.includes('null')) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: 'error',
        message: `Expected type "${resolved.type}", got null`,
      });
    }
    return;
  }

  // Enum check
  if (resolved.enum) {
    if (!resolved.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: 'error',
        message: `Value must be one of: ${resolved.enum.map((e) => JSON.stringify(e)).join(', ')}`,
      });
    }
    return;
  }

  const schemaType = getSchemaType(resolved);

  // Type mismatch
  if (schemaType) {
    const jsType = getJsType(value);
    if (!typesMatch(jsType, schemaType)) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: 'error',
        message: `Expected type "${schemaType}", got ${jsType}`,
      });
      return;
    }
  }

  // Object validation
  if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
    validateObject(state, node, value as Record<string, unknown>, resolved, spec, diagnostics);
    return;
  }

  // Array validation
  if (Array.isArray(value)) {
    validateArray(state, node, value, resolved, spec, diagnostics);
    return;
  }

  // String constraints
  if (typeof value === 'string') {
    validateString(node, value, resolved, diagnostics);
    return;
  }

  // Number constraints
  if (typeof value === 'number') {
    validateNumber(node, value, resolved, diagnostics);
  }
}

// -- Object validation -----------------------------------------------------

function validateObject(
  state: EditorState,
  node: SyntaxNode,
  value: Record<string, unknown>,
  schema: SchemaObject,
  spec: OpenApiSpec,
  diagnostics: Diagnostic[],
): void {
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);

  // Required fields check - highlight the Object's opening `{`
  for (const key of required) {
    if (!(key in value)) {
      diagnostics.push({
        from: node.from,
        to: node.from + 1,
        severity: 'error',
        message: `Missing required property "${key}"`,
      });
    }
  }

  // Additional properties check
  if (schema.additionalProperties === false) {
    const existingKeys = collectExistingKeys(state, node);
    for (const key of existingKeys) {
      if (!(key in properties)) {
        const nameNode = findPropertyNameNode(state, node, key);
        if (nameNode) {
          diagnostics.push({
            from: nameNode.from,
            to: nameNode.to,
            severity: 'error',
            message: `Unknown property "${key}"`,
          });
        }
      }
    }
  }

  // Recurse into known properties
  for (const [key, propSchema] of Object.entries(properties)) {
    if (!(key in value)) continue;

    const resolvedProp = resolveSchema(propSchema, spec);
    if (resolvedProp.readOnly) continue;

    const valueNode = findPropertyValueNode(state, node, key);
    if (!valueNode) continue;

    validateValue(state, valueNode, value[key], propSchema, spec, diagnostics);
  }
}

// -- Array validation ------------------------------------------------------

function validateArray(
  state: EditorState,
  node: SyntaxNode,
  value: unknown[],
  schema: SchemaObject,
  spec: OpenApiSpec,
  diagnostics: Diagnostic[],
): void {
  if (!schema.items) return;

  const itemNodes = getArrayItemNodes(node);

  for (let i = 0; i < value.length; i++) {
    const itemNode = itemNodes[i];
    if (!itemNode) continue;
    validateValue(state, itemNode, value[i], schema.items, spec, diagnostics);
  }
}

// -- String validation -----------------------------------------------------

function validateString(
  node: SyntaxNode,
  value: string,
  schema: SchemaObject,
  diagnostics: Diagnostic[],
): void {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: `String must be at least ${schema.minLength} character(s) long`,
    });
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: `String must be at most ${schema.maxLength} character(s) long`,
    });
  }

  if (schema.pattern) {
    try {
      if (!new RegExp(schema.pattern).test(value)) {
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'error',
          message: `String must match pattern "${schema.pattern}"`,
        });
      }
    } catch {
      // Invalid regex in schema - skip
    }
  }

  if (schema.format) {
    validateFormat(node, value, schema.format, diagnostics);
  }
}

// -- Number validation -----------------------------------------------------

function validateNumber(
  node: SyntaxNode,
  value: number,
  schema: SchemaObject,
  diagnostics: Diagnostic[],
): void {
  const schemaType = getSchemaType(schema);

  if (schemaType === 'integer' && !Number.isInteger(value)) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: 'Value must be an integer',
    });
  }

  if (schema.minimum !== undefined && value < schema.minimum) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: `Value must be >= ${schema.minimum}`,
    });
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: `Value must be <= ${schema.maximum}`,
    });
  }

  if (schema.exclusiveMinimum !== undefined) {
    const limit = typeof schema.exclusiveMinimum === 'boolean'
      ? (schema.exclusiveMinimum ? schema.minimum : undefined)
      : schema.exclusiveMinimum;
    if (limit !== undefined && value <= limit) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: 'error',
        message: `Value must be > ${limit}`,
      });
    }
  }

  if (schema.exclusiveMaximum !== undefined) {
    const limit = typeof schema.exclusiveMaximum === 'boolean'
      ? (schema.exclusiveMaximum ? schema.maximum : undefined)
      : schema.exclusiveMaximum;
    if (limit !== undefined && value >= limit) {
      diagnostics.push({
        from: node.from,
        to: node.to,
        severity: 'error',
        message: `Value must be < ${limit}`,
      });
    }
  }
}

// -- Format validation -----------------------------------------------------

const FORMAT_PATTERNS: Record<string, RegExp> = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  date: /^\d{4}-\d{2}-\d{2}$/,
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  time: /^\d{2}:\d{2}:\d{2}(\.\d+)?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

function validateFormat(
  node: SyntaxNode,
  value: string,
  format: string,
  diagnostics: Diagnostic[],
): void {
  const pattern = FORMAT_PATTERNS[format];
  if (!pattern) return;

  if (!pattern.test(value)) {
    diagnostics.push({
      from: node.from,
      to: node.to,
      severity: 'error',
      message: `Invalid ${format} format`,
    });
  }
}

// -- Tree-to-position helpers ----------------------------------------------

/**
 * Finds the value SyntaxNode for a given property key within an Object node.
 */
function findPropertyValueNode(
  state: EditorState,
  objectNode: SyntaxNode,
  key: string,
): SyntaxNode | null {
  let child = objectNode.firstChild;

  while (child) {
    if (child.name === 'Property') {
      const nameNode = child.firstChild;
      if (nameNode && (nameNode.name === 'PropertyName' || nameNode.name === 'String')) {
        const raw = state.sliceDoc(nameNode.from, nameNode.to).replace(/^"|"$/g, '');
        if (raw === key) {
          // The value is the last meaningful child of Property
          let valueNode = nameNode.nextSibling;
          while (valueNode) {
            // Skip punctuation tokens like ":"
            if (valueNode.name !== ':') {
              return valueNode;
            }
            valueNode = valueNode.nextSibling;
          }
        }
      }
    }
    child = child.nextSibling;
  }

  return null;
}

/**
 * Finds the PropertyName SyntaxNode for a given key within an Object node.
 */
function findPropertyNameNode(
  state: EditorState,
  objectNode: SyntaxNode,
  key: string,
): SyntaxNode | null {
  let child = objectNode.firstChild;

  while (child) {
    if (child.name === 'Property') {
      const nameNode = child.firstChild;
      if (nameNode && (nameNode.name === 'PropertyName' || nameNode.name === 'String')) {
        const raw = state.sliceDoc(nameNode.from, nameNode.to).replace(/^"|"$/g, '');
        if (raw === key) return nameNode;
      }
    }
    child = child.nextSibling;
  }

  return null;
}

/**
 * Collects the value child nodes of an Array node.
 */
function getArrayItemNodes(arrayNode: SyntaxNode): SyntaxNode[] {
  const items: SyntaxNode[] = [];
  let child = arrayNode.firstChild;

  while (child) {
    // Skip brackets and commas
    if (child.name !== '[' && child.name !== ']' && child.name !== ',') {
      items.push(child);
    }
    child = child.nextSibling;
  }

  return items;
}

// -- Type helpers ----------------------------------------------------------

function getSchemaType(schema: SchemaObject): string | null {
  if (!schema.type) return null;

  if (Array.isArray(schema.type)) {
    return schema.type.find((t: string) => t !== 'null') ?? schema.type[0] ?? null;
  }

  return schema.type;
}

function getJsType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function typesMatch(jsType: string, schemaType: string): boolean {
  switch (schemaType) {
    case 'string':
      return jsType === 'string';
    case 'number':
    case 'integer':
      return jsType === 'number';
    case 'boolean':
      return jsType === 'boolean';
    case 'object':
      return jsType === 'object';
    case 'array':
      return jsType === 'array';
    case 'null':
      return jsType === 'null';
    default:
      return true;
  }
}
