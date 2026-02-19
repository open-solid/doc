import type { Endpoint, OpenApiSpec } from '../openapi';
import { generateExampleJson, resolveSchema } from './schema';

export function generateCurl(endpoint: Endpoint, baseUrl: string, spec: OpenApiSpec): string {
  const url = `${baseUrl.replace(/\/$/, '')}${endpoint.path}`;
  const parts: string[] = ['curl'];

  if (endpoint.method !== 'get') {
    parts.push(`-X ${endpoint.method.toUpperCase()}`);
  }

  // URL with path params as placeholders
  let finalUrl = url;
  const queryParams: string[] = [];

  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      finalUrl = finalUrl.replace(`{${param.name}}`, `:${param.name}`);
    } else if (param.in === 'query') {
      queryParams.push(`${param.name}=value`);
    } else if (param.in === 'header') {
      parts.push(`-H "${param.name}: value"`);
    }
  }

  if (queryParams.length > 0) {
    finalUrl += `?${queryParams.join('&')}`;
  }

  parts.push(`"${finalUrl}"`);

  // Request body
  const jsonContent = endpoint.requestBody?.content['application/json'];
  if (jsonContent?.schema) {
    parts.push('-H "Content-Type: application/json"');
    const resolved = resolveSchema(jsonContent.schema, spec);
    const body = generateExampleJson(resolved, spec);
    parts.push(`-d '${JSON.stringify(body, null, 2)}'`);
  }

  return parts.join(' \\\n  ');
}
