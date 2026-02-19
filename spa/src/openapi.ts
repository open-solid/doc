export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  servers?: { url: string; description?: string }[];
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';

export type PathItem = Partial<Record<HttpMethod, Operation>>;

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: OperationParameter[];
  requestBody?: RequestBody;
  responses?: Record<string, ResponseObject>;
}

export interface OperationParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, MediaType>;
}

export interface MediaType {
  schema?: SchemaObject;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface SchemaObject {
  $ref?: string;
  type?: string | string[];
  format?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: unknown[];
  example?: unknown;
  description?: string;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  nullable?: boolean;
  additionalProperties?: boolean | SchemaObject;
}

export interface Endpoint {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  parameters: OperationParameter[];
  requestBody?: RequestBody;
  responses: Record<string, ResponseObject>;
  tags: string[];
}
