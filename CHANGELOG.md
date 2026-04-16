# Changelog

## [1.0.0] - 2026-04-17

### Added

- HttpClient with request deduplication, token injection, and transform hooks
- TokenManager with automatic refresh and request queuing
- ResponseMapper for standardizing API responses
- ServiceProvider factory with React Query hooks
- QueryKeys factory for type-safe cache keys
- EventEmitter for internal events
- Full TypeScript support

### Types

- Id, Cursor, ListResponse, InfiniteResponse, PaginationMeta
- MappingConfig, ApiErrorResponse, TransformPageContext
