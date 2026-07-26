import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extends Zod with OpenAPI metadata support so that schemas registered
// with the registry can carry .openapi() annotations (examples, descriptions).
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// BearerAuth is registered globally so that individual route definitions
// can reference it via `security: [{ bearerAuth: [] }]`.
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Flux Pay API',
      description: 'API documentation for the Flux Pay backend challenge',
    },
    servers: [{ url: 'http://localhost:3000' }],
  });
}
