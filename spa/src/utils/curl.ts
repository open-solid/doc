import type { Endpoint, OpenApiSpec } from '../openapi';
import { generateExampleJson, resolveSchema } from './schema';

export function generateCurl(endpoint: Endpoint, baseUrl: string, spec: OpenApiSpec): string {
  const origin = baseUrl && baseUrl !== '/' ? baseUrl.replace(/\/$/, '') : 'https://localhost';
  const url = `${origin}${endpoint.path}`;
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

  // Request body — check all common content types
  const content = endpoint.requestBody?.content;
  const bodyEntry = content?.['application/json']
    ?? content?.['application/ld+json']
    ?? content?.['application/merge-patch+json'];
  const contentType = content?.['application/json'] ? 'application/json'
    : content?.['application/ld+json'] ? 'application/ld+json'
    : content?.['application/merge-patch+json'] ? 'application/merge-patch+json'
    : null;

  if (bodyEntry?.schema && contentType) {
    parts.push(`-H "Content-Type: ${contentType}"`);
    const resolved = resolveSchema(bodyEntry.schema, spec);
    const body = generateExampleJson(resolved, spec);
    parts.push(`-d '${JSON.stringify(body, null, 2)}'`);
  }

  return parts.join(' \\\n  ');
}
