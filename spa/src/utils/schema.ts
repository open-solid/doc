import type { SchemaObject, OpenApiSpec } from '../openapi';

export function resolveSchema(schema: SchemaObject, spec: OpenApiSpec): SchemaObject {
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    return spec.components?.schemas?.[refPath] ?? {};
  }
  return schema;
}

export function generateExampleJson(schema: SchemaObject, spec: OpenApiSpec, depth = 0): unknown {
  if (depth > 8) return {};

  const resolved = resolveSchema(schema, spec);

  if (resolved.example !== undefined) return resolved.example;

  if (resolved.allOf) {
    const merged: Record<string, unknown> = {};
    for (const sub of resolved.allOf) {
      const val = generateExampleJson(sub, spec, depth + 1);
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        Object.assign(merged, val);
      }
    }
    return merged;
  }

  if (resolved.oneOf?.[0]) {
    return generateExampleJson(resolved.oneOf[0], spec, depth + 1);
  }

  if (resolved.anyOf?.[0]) {
    return generateExampleJson(resolved.anyOf[0], spec, depth + 1);
  }

  if (resolved.enum && resolved.enum.length > 0) {
    return resolved.enum[0];
  }

  const type = Array.isArray(resolved.type)
    ? resolved.type.find((t: string) => t !== 'null') ?? resolved.type[0]
    : resolved.type;

  switch (type) {
    case 'object': {
      const obj: Record<string, unknown> = {};
      if (resolved.properties) {
        for (const [key, prop] of Object.entries(resolved.properties)) {
          obj[key] = generateExampleJson(prop, spec, depth + 1);
        }
      }
      return obj;
    }
    case 'array': {
      if (resolved.items) {
        return [generateExampleJson(resolved.items, spec, depth + 1)];
      }
      return [];
    }
    case 'string': {
      switch (resolved.format) {
        case 'date-time': return '2024-01-15T09:30:00Z';
        case 'date': return '2024-01-15';
        case 'email': return 'user@example.com';
        case 'uuid': return '550e8400-e29b-41d4-a716-446655440000';
        case 'uri': return 'https://example.com';
        default: return 'string';
      }
    }
    case 'integer': return 0;
    case 'number': return 0.0;
    case 'boolean': return true;
    default: return null;
  }
}
