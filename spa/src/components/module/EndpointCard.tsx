import { useMemo } from 'react';
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

interface Attribute {
  name: string;
  type: string;
  description?: string;
}

function getSchemaType(schema: SchemaObject | undefined): string {
  if (!schema) return 'any';
  if (schema.$ref) return schema.$ref.split('/').pop() ?? 'object';
  if (schema.type === 'array' && schema.items) return `${getSchemaType(schema.items)}[]`;
  return schema.type ?? 'any';
}

function AttributeList({ title, attributes }: { title: string; attributes: Attribute[] }) {
  if (attributes.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h4>
      <div className="space-y-4">
        {attributes.map((attr, i) => (
          <div key={attr.name} className={i < attributes.length - 1 ? 'pb-4 border-b border-slate-100 dark:border-slate-700/50' : ''}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{attr.name}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{attr.type}</span>
            </div>
            {attr.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{attr.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EndpointCard({ endpoint, spec }: EndpointCardProps) {
  const baseUrl = spec.servers?.[0]?.url ?? '';

  const curlCommand = useMemo(() => generateCurl(endpoint, baseUrl, spec), [endpoint, baseUrl, spec]);

  const { requiredAttrs, optionalAttrs } = useMemo(() => {
    const required: Attribute[] = [];
    const optional: Attribute[] = [];

    for (const param of endpoint.parameters) {
      const attr: Attribute = {
        name: param.name,
        type: getSchemaType(param.schema),
        description: param.description,
      };
      if (param.required) {
        required.push(attr);
      } else {
        optional.push(attr);
      }
    }

    const bodySchema = endpoint.requestBody?.content['application/json']?.schema;
    if (bodySchema) {
      const resolved = resolveSchema(bodySchema, spec);
      const requiredFields = new Set(resolved.required ?? []);
      if (resolved.properties) {
        for (const [name, propSchema] of Object.entries(resolved.properties)) {
          const resolvedProp = resolveSchema(propSchema, spec);
          const attr: Attribute = {
            name,
            type: getSchemaType(propSchema),
            description: resolvedProp.description,
          };
          if (requiredFields.has(name)) {
            required.push(attr);
          } else {
            optional.push(attr);
          }
        }
      }
    }

    return { requiredAttrs: required, optionalAttrs: optional };
  }, [endpoint, spec]);

  const responseJson = useMemo(() => {
    // Pick the first success response (2xx) or fall back to first available
    const codes = Object.keys(endpoint.responses);
    const successCode = codes.find(c => c.startsWith('2')) ?? codes[0];
    if (!successCode) return null;
    const response = endpoint.responses[successCode];
    if (!response) return null;
    const mediaType = response.content?.['application/json'];
    if (!mediaType?.schema) return null;
    const resolved = resolveSchema(mediaType.schema, spec);
    return JSON.stringify(generateExampleJson(resolved, spec), null, 2);
  }, [endpoint, spec]);

  return (
    <article className="item-card rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
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

          <AttributeList title="Required attributes" attributes={requiredAttrs} />
          <AttributeList title="Optional attributes" attributes={optionalAttrs} />
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
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Response</h4>
            {responseJson ? (
              <CodeBlock code={responseJson} language="json" />
            ) : (
              <p className="text-sm italic text-slate-400 dark:text-slate-500">No response body</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
