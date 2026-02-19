import { useState, useMemo } from 'react';
import type { Endpoint, OpenApiSpec } from '../../openapi';
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

interface AttributeRow {
  name: string;
  type: string;
  description?: string;
}

function AttributeTable({ title, rows }: { title: string; rows: AttributeRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">{title}</h4>
      <div className="rounded-lg border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/50">
              <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Name</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-2 px-3 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.name} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 font-mono text-sm text-primary-600 dark:text-primary-400">{row.name}</td>
                <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{row.type}</td>
                <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-xs">{row.description ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getSchemaType(schema: SchemaObject | undefined): string {
  if (!schema) return 'any';
  if (schema.$ref) return schema.$ref.split('/').pop() ?? 'object';
  if (schema.type === 'array' && schema.items) return `${getSchemaType(schema.items)}[]`;
  return schema.type ?? 'any';
}

import type { SchemaObject } from '../../openapi';

export function EndpointCard({ endpoint, spec }: EndpointCardProps) {
  const responseCodes = Object.keys(endpoint.responses);
  const [activeResponse, setActiveResponse] = useState(responseCodes[0] ?? '200');

  const baseUrl = spec.servers?.[0]?.url ?? '';

  const curlCommand = useMemo(() => generateCurl(endpoint, baseUrl, spec), [endpoint, baseUrl, spec]);

  const { requiredRows, optionalRows } = useMemo(() => {
    const required: AttributeRow[] = [];
    const optional: AttributeRow[] = [];

    // Parameters
    for (const param of endpoint.parameters) {
      const row: AttributeRow = {
        name: param.name,
        type: `${param.in} · ${getSchemaType(param.schema)}`,
        description: param.description,
      };
      if (param.required) {
        required.push(row);
      } else {
        optional.push(row);
      }
    }

    // Request body properties
    const bodySchema = endpoint.requestBody?.content['application/json']?.schema;
    if (bodySchema) {
      const resolved = resolveSchema(bodySchema, spec);
      const requiredFields = new Set(resolved.required ?? []);
      if (resolved.properties) {
        for (const [name, propSchema] of Object.entries(resolved.properties)) {
          const resolvedProp = resolveSchema(propSchema, spec);
          const row: AttributeRow = {
            name,
            type: `body · ${getSchemaType(propSchema)}`,
            description: resolvedProp.description,
          };
          if (requiredFields.has(name)) {
            required.push(row);
          } else {
            optional.push(row);
          }
        }
      }
    }

    return { requiredRows: required, optionalRows: optional };
  }, [endpoint, spec]);

  const responseJson = useMemo(() => {
    const response = endpoint.responses[activeResponse];
    if (!response) return null;
    const mediaType = response.content?.['application/json'];
    if (!mediaType?.schema) return null;
    const resolved = resolveSchema(mediaType.schema, spec);
    return JSON.stringify(generateExampleJson(resolved, spec), null, 2);
  }, [endpoint, activeResponse, spec]);

  return (
    <article className="item-card rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left panel */}
        <div className="p-5 lg:border-r border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded ${METHOD_COLORS[endpoint.method] ?? 'bg-slate-100 text-slate-700'}`}>
              {endpoint.method}
            </span>
            <code className="text-sm font-mono text-slate-800 dark:text-slate-200">{endpoint.path}</code>
            {endpoint.deprecated && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
                deprecated
              </span>
            )}
          </div>

          {endpoint.summary && (
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{endpoint.summary}</h3>
          )}
          {endpoint.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{endpoint.description}</p>
          )}

          <AttributeTable title="Required attributes" rows={requiredRows} />
          <AttributeTable title="Optional attributes" rows={optionalRows} />
        </div>

        {/* Right panel */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/50">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Request</h4>
              <span className="text-[11px] font-medium text-slate-400">cURL</span>
            </div>
            <CodeBlock code={curlCommand} language="bash" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Response</h4>
              <div className="flex gap-1">
                {responseCodes.map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setActiveResponse(code)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                      code === activeResponse
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
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
