import type { Endpoint, OpenApiSpec } from '../openapi';
import { generateExampleJson, resolveSchema } from './schema';

export function generateCurl(endpoint: Endpoint, baseUrl: string, spec: OpenApiSpec): string {
  const origin = baseUrl && baseUrl !== '/' ? baseUrl.replace(/\/$/, '') : 'https://localhost';

  // Build URL with path param placeholders and query params
  let finalUrl = `${origin}${endpoint.path}`;
  const queryParams: string[] = [];
  const extraLines: string[] = [];

  for (const param of endpoint.parameters) {
    if (param.in === 'path') {
      finalUrl = finalUrl.replace(`{${param.name}}`, `:${param.name}`);
    } else if (param.in === 'query') {
      queryParams.push(`${param.name}=value`);
    } else if (param.in === 'header') {
      extraLines.push(`-H "${param.name}: value"`);
    }
  }

  if (queryParams.length > 0) {
    finalUrl += `?${queryParams.join('&')}`;
  }

  // First line: curl [-X METHOD] "URL"
  const method = endpoint.method !== 'get' ? `-X ${endpoint.method.toUpperCase()} ` : '';
  const firstLine = `curl ${method}"${finalUrl}"`;

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
    extraLines.push(`-H "Content-Type: ${contentType}"`);
    const resolved = resolveSchema(bodyEntry.schema, spec);
    const body = generateExampleJson(resolved, spec);
    extraLines.push(`-d '${JSON.stringify(body, null, 2)}'`);
  }

  if (extraLines.length === 0) return firstLine;

  return `${firstLine} \\\n  ${extraLines.join(' \\\n  ')}`;
}
