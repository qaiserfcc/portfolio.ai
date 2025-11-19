# System Patterns

## Architectural Patterns

- **Layered Architecture**: Clear separation between presentation (React components), application (API routes), domain (services), and infrastructure (database/storage) layers.

- **Hexagonal Architecture**: Business logic isolated from external concerns (database, UI, external APIs) through ports and adapters.

- **Event-Driven Architecture**: Potential for background processing of uploads and AI generation (currently synchronous).

## Design Patterns

- **Repository Pattern**: `src/lib/db/services.ts` provides data access abstraction with methods like `createResume`, `listUserPortfolios`.

- **Service Layer Pattern**: Business logic encapsulated in service functions that coordinate multiple repositories.

- **Factory Pattern**: Theme generation and content creation use factory-like structures for different output types.

- **Strategy Pattern**: Storage providers (`uploadEncryptedFile`) and AI models can be swapped via configuration.

- **Middleware Pattern**: Authentication, authorization, and rate limiting implemented as composable middleware.

- **Observer Pattern**: Components subscribe to state changes (React useState/useEffect).

## Common Idioms

- **Async/Await**: All I/O operations use async/await for readability and error handling.

- **Error Boundaries**: Try/catch blocks around all async operations with consistent error responses.

- **Environment Configuration**: All secrets and config loaded from environment variables with `.env.example` templates.

- **TypeScript Interfaces**: Strong typing for API requests/responses and database schemas.

- **Component Composition**: React components built through composition rather than inheritance.

- **Custom Hooks**: Reusable logic extracted into custom hooks (not yet implemented extensively).

- **Utility Functions**: Pure functions for data transformation and validation.

## Code Organization Patterns

- **Feature-based Structure**: Code organized by feature (auth, upload, portfolio) rather than technical layers.

- **Index Files**: Barrel exports in `index.ts` files for clean imports.

- **Consistent Naming**: PascalCase for components, camelCase for functions, UPPER_SNAKE_CASE for constants.

- **Single Responsibility**: Each file/function has one clear purpose.

## Security Patterns

- **Input Validation**: All user inputs validated on both client and server.

- **Output Encoding**: All dynamic content properly escaped to prevent XSS.

- **Secure Defaults**: APIs fail securely by default.

- **Audit Logging**: All security-relevant events logged for monitoring.

## Performance Patterns

- **Lazy Loading**: Components and routes loaded on demand.

- **Image Optimization**: Next.js Image component for automatic optimization.

- **Caching**: Browser caching for static assets, potential API response caching.

- **Connection Pooling**: Database connections pooled for efficiency.
