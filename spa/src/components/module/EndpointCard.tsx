import { useState, useMemo } from 'react';
import type { Endpoint, OpenApiSpec, SchemaObject } from '../../openapi';
import { generateCurl } from '../../utils/curl';
import { generateExampleJson, resolveSchema } from '../../utils/schema';
import { CodeBlock } from '../CodeBlock';

interface EndpointCardProps {
  endpoint: Endpoint;
  spec: OpenApiSpec;
}

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  post: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
  put: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  patch: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  delete: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const METHOD_TEXT_COLORS: Record<string, string> = {
  get: 'text-emerald-600 dark:text-emerald-400',
  post: 'text-primary-600 dark:text-primary-400',
  put: 'text-amber-600 dark:text-amber-400',
  patch: 'text-amber-600 dark:text-amber-400',
  delete: 'text-rose-600 dark:text-rose-400',
};

interface Constraints {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  pattern?: string;
  default?: unknown;
  readOnly?: boolean;
}

interface Attribute {
  name: string;
  type: string;
  format?: string;
  optional?: boolean;
  description?: string;
  children?: Attribute[];
  constraints?: Constraints;
}

const KNOWN_FORMATS = new Set([
  'date-time', 'date', 'time', 'duration',
  'email', 'uri', 'uuid', 'ulid',
  'iri', 'iri-reference',
  'ipv4', 'ipv6', 'hostname',
  'int32', 'int64', 'float', 'double',
]);

function getSchemaType(schema: SchemaObject | undefined, spec?: OpenApiSpec): string {
  if (!schema) return 'any';
  if (schema.$ref && spec) {
    const resolved = resolveSchema(schema, spec);
    if (resolved.enum && resolved.enum.length > 0) {
      return resolved.enum.map(v => `"${v}"`).join(' or ');
    }
    return 'object';
  }
  if (schema.$ref) return 'object';
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.map(v => `"${v}"`).join(' or ');
  }
  if (Array.isArray(schema.type)) {
    const types = (schema.type as string[]).filter(t => t !== 'null');
    return types.join(' or ') || 'any';
  }
  if (schema.type === 'array' && schema.items) {
    const itemType = getSchemaType(schema.items, spec);
    return `array of ${itemType}`;
  }
  const union = schema.oneOf ?? schema.anyOf;
  if (union && union.length > 0) {
    const types = union.map(s => getSchemaType(s, spec)).filter(t => t !== 'null');
    return types.join(' or ') || 'any';
  }
  return schema.type ?? 'any';
}

function getSchemaFormat(schema: SchemaObject | undefined, spec?: OpenApiSpec): string | undefined {
  if (!schema) return undefined;
  const resolved = spec && schema.$ref ? resolveSchema(schema, spec) : schema;
  if (resolved.format && KNOWN_FORMATS.has(resolved.format)) return resolved.format;
  return undefined;
}

function isNullableType(schema: SchemaObject | undefined): boolean {
  if (!schema) return false;
  if (Array.isArray(schema.type)) return (schema.type as string[]).includes('null');
  if (schema.nullable) return true;
  return false;
}

function normalizeExclusive(value: number | boolean | undefined, fallback: number | undefined): number | undefined {
  if (typeof value === 'number') return value;
  if (value === true && fallback !== undefined) return fallback;
  return undefined;
}

function extractConstraints(schema: SchemaObject, spec: OpenApiSpec): Constraints | undefined {
  const resolved = schema.$ref ? resolveSchema(schema, spec) : schema;
  const c: Constraints = {};
  let hasAny = false;

  if (resolved.minLength !== undefined) { c.minLength = resolved.minLength; hasAny = true; }
  if (resolved.maxLength !== undefined) { c.maxLength = resolved.maxLength; hasAny = true; }
  if (resolved.minimum !== undefined) { c.minimum = resolved.minimum; hasAny = true; }
  if (resolved.maximum !== undefined) { c.maximum = resolved.maximum; hasAny = true; }

  const exMin = normalizeExclusive(resolved.exclusiveMinimum, resolved.minimum);
  if (exMin !== undefined) { c.exclusiveMinimum = exMin; hasAny = true; }

  const exMax = normalizeExclusive(resolved.exclusiveMaximum, resolved.maximum);
  if (exMax !== undefined) { c.exclusiveMaximum = exMax; hasAny = true; }

  if (resolved.pattern !== undefined) { c.pattern = resolved.pattern; hasAny = true; }
  if (resolved.default !== undefined) { c.default = resolved.default; hasAny = true; }
  if (resolved.readOnly === true) { c.readOnly = true; hasAny = true; }

  return hasAny ? c : undefined;
}

function formatNumericRange(c: Constraints): string | undefined {
  const min = c.exclusiveMinimum ?? c.minimum;
  const max = c.exclusiveMaximum ?? c.maximum;
  const minExclusive = c.exclusiveMinimum !== undefined;
  const maxExclusive = c.exclusiveMaximum !== undefined;

  if (min !== undefined && max !== undefined && !minExclusive && !maxExclusive) return `${min}..${max}`;
  if (min !== undefined && max !== undefined) {
    const left = minExclusive ? `${min}<` : `${min}`;
    const right = maxExclusive ? `<${max}` : `${max}`;
    return `${left}..${right}`;
  }
  if (min !== undefined) return minExclusive ? `> ${min}` : `>= ${min}`;
  if (max !== undefined) return maxExclusive ? `< ${max}` : `<= ${max}`;
  return undefined;
}

function formatLengthRange(c: Constraints): string | undefined {
  if (c.minLength !== undefined && c.maxLength !== undefined) return `${c.minLength}..${c.maxLength}`;
  if (c.minLength !== undefined) return `>= ${c.minLength}`;
  if (c.maxLength !== undefined) return `<= ${c.maxLength}`;
  return undefined;
}

function ConstraintBadges({ constraints }: { constraints: Constraints }) {
  const badges: { text: string; title?: string; isDefault?: boolean }[] = [];

  const numRange = formatNumericRange(constraints);
  if (numRange) badges.push({ text: numRange });

  const lenRange = formatLengthRange(constraints);
  if (lenRange) badges.push({ text: lenRange });

  if (constraints.pattern) badges.push({ text: 'pattern', title: constraints.pattern });

  if (constraints.default !== undefined) {
    badges.push({ text: `= ${String(constraints.default)}`, isDefault: true });
  }

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map(b => (
        <span
          key={b.text}
          title={b.title}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            b.isDefault
              ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400'
          }`}
        >
          {b.text}
        </span>
      ))}
    </>
  );
}

function resolveResponseSchema(response: { content?: Record<string, { schema?: SchemaObject }> }, spec: OpenApiSpec): SchemaObject | null {
  const content = response.content;
  const mediaType = content?.['application/json'] ?? content?.['application/ld+json'];
  if (!mediaType?.schema) return null;
  return resolveSchema(mediaType.schema, spec);
}

function collectProperties(schema: SchemaObject, spec: OpenApiSpec): Record<string, SchemaObject> {
  const resolved = resolveSchema(schema, spec);
  let props: Record<string, SchemaObject> = {};

  if (resolved.allOf) {
    for (const sub of resolved.allOf) {
      Object.assign(props, collectProperties(sub, spec));
    }
  }
  if (resolved.oneOf?.[0]) {
    Object.assign(props, collectProperties(resolved.oneOf[0], spec));
  }
  if (resolved.anyOf?.[0]) {
    Object.assign(props, collectProperties(resolved.anyOf[0], spec));
  }
  if (resolved.properties) {
    props = { ...props, ...resolved.properties };
  }

  return props;
}

function getNestedChildren(schema: SchemaObject, spec: OpenApiSpec, depth = 0): Attribute[] | undefined {
  if (depth > 4) return undefined;
  const resolved = resolveSchema(schema, spec);

  // For arrays, look at the items schema
  let target = resolved;
  if (resolved.type === 'array' && resolved.items) {
    target = resolveSchema(resolved.items, spec);
  }

  const props = collectProperties(target, spec);
  if (Object.keys(props).length === 0) return undefined;

  const required = new Set(target.required ?? []);
  const children: Attribute[] = [];
  for (const [name, propSchema] of Object.entries(props)) {
    const resolvedProp = resolveSchema(propSchema, spec);
    children.push({
      name,
      type: getSchemaType(propSchema, spec),
      format: getSchemaFormat(propSchema, spec),
      optional: !required.has(name) || isNullableType(propSchema),
      description: resolvedProp.description,
      children: getNestedChildren(propSchema, spec, depth + 1),
      constraints: extractConstraints(propSchema, spec),
    });
  }
  return children.length > 0 ? children : undefined;
}

function extractAttributes(schema: SchemaObject, spec: OpenApiSpec): Attribute[] {
  const props = collectProperties(schema, spec);
  const attrs: Attribute[] = [];
  for (const [name, propSchema] of Object.entries(props)) {
    const resolvedProp = resolveSchema(propSchema, spec);
    attrs.push({
      name,
      type: getSchemaType(propSchema, spec),
      format: getSchemaFormat(propSchema, spec),
      description: resolvedProp.description,
      children: getNestedChildren(propSchema, spec),
      constraints: extractConstraints(propSchema, spec),
    });
  }
  return attrs;
}

function AttributeRow({ attr, isLast, depth = 0 }: { attr: Attribute; isLast: boolean; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = attr.children && attr.children.length > 0;

  return (
    <div className={!isLast ? 'pb-4 border-b border-slate-100 dark:border-slate-700/50' : ''}>
      <div className={`flex items-baseline gap-2 ${hasChildren ? '-ml-[22px]' : ''}`}>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className={`self-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors${depth > 0 ? ' rounded bg-slate-200 dark:bg-slate-700 -ml-[2px] mr-[2px]' : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {expanded
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />}
            </svg>
          </button>
        )}
        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{attr.name}</span>
        {attr.optional && (
          <span className="text-xs text-slate-400 dark:text-slate-500">optional</span>
        )}
        {attr.constraints?.readOnly && (
          <span className="text-xs text-amber-500 dark:text-amber-400">read-only</span>
        )}
        <span className="text-sm text-slate-500 dark:text-slate-400">{attr.type}</span>
        {attr.format && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">{attr.format}</span>
        )}
        {attr.constraints && <ConstraintBadges constraints={attr.constraints} />}
      </div>
      {attr.description && (
        <p className={`mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${hasChildren ? 'ml-[22px]' : ''}`}>{attr.description}</p>
      )}
      {hasChildren && expanded && (
        <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
          {attr.children!.map((child, j) => (
            <AttributeRow key={child.name} attr={child} isLast={j === attr.children!.length - 1} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function AttributeList({ title, attributes, children }: { title: string; attributes: Attribute[]; children?: React.ReactNode }) {
  if (attributes.length === 0 && !children) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
      {children ?? <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">{title}</h4>}
      <div className="space-y-4">
        {attributes.map((attr, i) => (
          <AttributeRow key={attr.name} attr={attr} isLast={i === attributes.length - 1} />
        ))}
      </div>
    </div>
  );
}

interface ResponseData {
  code: string;
  description?: string;
  attributes: Attribute[];
  json: string | null;
}

export function EndpointCard({ endpoint, spec }: EndpointCardProps) {
  const baseUrl = spec.servers?.[0]?.url ?? '';

  const curlCommand = useMemo(() => generateCurl(endpoint, baseUrl, spec), [endpoint, baseUrl, spec]);

  const pathParams = useMemo(() =>
    endpoint.parameters
      .filter(p => p.in === 'path')
      .map(p => ({ name: p.name, type: getSchemaType(p.schema, spec), format: getSchemaFormat(p.schema, spec), description: p.description })),
    [endpoint, spec],
  );

  const queryParams = useMemo(() =>
    endpoint.parameters
      .filter(p => p.in === 'query')
      .map(p => ({ name: p.name, type: getSchemaType(p.schema, spec), format: getSchemaFormat(p.schema, spec), optional: !p.required, description: p.description, children: p.schema ? getNestedChildren(p.schema, spec) : undefined, constraints: p.schema ? extractConstraints(p.schema, spec) : undefined })),
    [endpoint, spec],
  );

  const bodyParams = useMemo(() => {
    const attrs: Attribute[] = [];
    const content = endpoint.requestBody?.content;
    const schema = content?.['application/json']?.schema
      ?? content?.['application/ld+json']?.schema
      ?? content?.['application/merge-patch+json']?.schema;
    if (!schema) return attrs;

    const resolved = resolveSchema(schema, spec);
    const requiredFields = new Set(resolved.required ?? []);
    if (resolved.properties) {
      for (const [name, propSchema] of Object.entries(resolved.properties)) {
        const resolvedProp = resolveSchema(propSchema, spec);
        attrs.push({
          name,
          type: getSchemaType(propSchema, spec),
          format: getSchemaFormat(propSchema, spec),
          optional: !requiredFields.has(name) || isNullableType(propSchema),
          description: resolvedProp.description,
          children: getNestedChildren(propSchema, spec),
          constraints: extractConstraints(propSchema, spec),
        });
      }
    }
    return attrs;
  }, [endpoint, spec]);

  const responses = useMemo(() => {
    const result: ResponseData[] = [];
    for (const [code, response] of Object.entries(endpoint.responses)) {
      const resolved = resolveResponseSchema(response, spec);
      const attributes = resolved ? extractAttributes(resolved, spec) : [];
      let json: string | null = null;
      if (resolved) {
        json = JSON.stringify(generateExampleJson(resolved, spec), null, 2);
      }
      result.push({ code, description: response.description, attributes, json });
    }
    return result;
  }, [endpoint, spec]);

  const defaultCode = responses.find(r => r.code.startsWith('2'))?.code ?? responses[0]?.code ?? '';
  const [activeResponseCode, setActiveResponseCode] = useState(defaultCode);
  const activeResponse = responses.find(r => r.code === activeResponseCode) ?? responses[0];

  const hasReturns = responses.some(r => r.attributes.length > 0);

  return (
    <article className="item-card rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel */}
        <div className="p-6 lg:border-r border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase rounded ${METHOD_COLORS[endpoint.method] ?? 'bg-slate-100 text-slate-700'}`}>
              {endpoint.method}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{endpoint.path}</span>
            {endpoint.deprecated && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                deprecated
              </span>
            )}
          </div>

          {endpoint.description && (
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{endpoint.description}</h3>
          )}
          {endpoint.summary && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{endpoint.summary}</p>
          )}

          <AttributeList title="Path parameters" attributes={pathParams} />
          <AttributeList title="Query parameters" attributes={queryParams} />
          <AttributeList title="Body parameters" attributes={bodyParams} />

          {hasReturns && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Returns</h4>
                <div className="flex gap-1">
                  {responses.map(r => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setActiveResponseCode(r.code)}
                      className={`text-[11px] font-semibold px-1.5 rounded-md border transition-colors ${
                        r.code === activeResponseCode
                          ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      {r.code}
                    </button>
                  ))}
                </div>
              </div>
              {activeResponse?.description && activeResponse.attributes.length > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{activeResponse.description}</p>
              )}
              {activeResponse && activeResponse.attributes.length > 0 ? (
                <div className="space-y-4">
                  {activeResponse.attributes.map((attr, i) => (
                    <AttributeRow key={attr.name} attr={attr} isLast={i === activeResponse.attributes.length - 1} />
                  ))}
                </div>
              ) : activeResponse ? (
                <p className="text-sm italic text-slate-400 dark:text-slate-500">{activeResponse.description ?? 'No content'}</p>
              ) : null}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Request</h4>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">cURL</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-bold uppercase ${METHOD_TEXT_COLORS[endpoint.method] ?? 'text-slate-500'}`}>
                {endpoint.method}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{endpoint.path}</span>
            </div>
            <CodeBlock code={curlCommand} language="bash" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Response</h4>
              {activeResponse && (
                <span className="text-[11px] font-semibold px-1.5 rounded-md border border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                  {activeResponse.code}
                </span>
              )}
            </div>
            {activeResponse?.json ? (
              <CodeBlock code={activeResponse.json} language="json" />
            ) : (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">No response body</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
