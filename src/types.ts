/**
 * Shared primitive id type used across resources.
 */
export type Id = string | number

/**
 * Cursor used for infinite pagination.
 */
export type Cursor = string | number | null | undefined

/**
 * Path resolver can be a nested string path (e.g. "meta.total")
 * or a mapper function for maximum performance and type safety.
 */
export type PathResolver<T, R> = string | ((data: T) => R)

/**
 * Pagination metadata for list response.
 */
export interface PaginationMeta {
  currentPage: number
  nextPage: number | null
  prevPage: number | null
  perPage: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Standard list response with metadata.
 */
export interface ListResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Standard shape for infinite list responses.
 */
export interface InfiniteResponse<T, C = Cursor> {
  items: T[]
  nextCursor?: C
  previousCursor?: C
}

/**
 * Mapping configuration for ResponseMapper.
 */
export interface MappingConfig {
  // List response
  listDataPath?: PathResolver<any, any[]>
  listTotalPath?: PathResolver<any, number>
  listPagePath?: PathResolver<any, number>
  listLimitPath?: PathResolver<any, number>

  // Single item
  itemDataPath?: PathResolver<any, any>

  // Infinite response
  infiniteItemsPath?: PathResolver<any, any[]>
  infiniteNextCursorPath?: PathResolver<any, any>
  infinitePrevCursorPath?: PathResolver<any, any>

  // Transformers
  transformPage?: (page: number) => number
  transformCursor?: (cursor: any) => any
}

/**
 * API error response shape.
 */
export interface ApiErrorResponse {
  error: string
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

/**
 * Type guard to check if payload is an API error response.
 */
export function isApiErrorResponse(payload: unknown): payload is ApiErrorResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    "message" in payload &&
    "statusCode" in payload
  )
}

/**
 * Standard pagination params.
 */
export interface PaginationParams {
  page?: number
  limit?: number
}
