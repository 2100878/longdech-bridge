import type { ListResponse, InfiniteResponse, MappingConfig, PathResolver, Cursor } from "./types"

/**
 * Helper to resolve value from a payload using either a string path or a mapper function.
 * This is a lightweight replacement for lodash/get.
 */
function resolvePath<T, R>(payload: any, resolver: PathResolver<T, R> | undefined, fallback: R): R {
  if (!resolver) return fallback

  if (typeof resolver === "function") {
    try {
      return (resolver(payload) as R) ?? fallback
    } catch {
      return fallback
    }
  }

  // String path resolution: "a.b.c"
  const parts = resolver.split(".")
  let current = payload

  for (const part of parts) {
    if (current === null || current === undefined) return fallback
    current = current[part]
  }

  return (current as R) ?? fallback
}

export class ResponseMapper {
  constructor(private readonly config: MappingConfig) {}

  /**
   * Map standard list response with pagination metadata.
   */
  mapList<T>(payload: unknown): ListResponse<T> {
    const data = resolvePath(payload, this.config.listDataPath, [])
    const total = resolvePath(payload, this.config.listTotalPath, 0)

    let currentPage = resolvePath(payload, this.config.listPagePath, 1)

    let perPage = resolvePath(payload, this.config.listLimitPath, undefined)

    if (perPage === undefined || perPage <= 0) {
      perPage = 10
    }

    const skip = resolvePath(payload, this.config.listSkipPath, undefined)

    if (skip !== undefined && currentPage === 1 && !this.config.listPagePath) {
      currentPage = Math.floor(skip / perPage) + 1
    }

    if (this.config.transformPage) {
      currentPage = this.config.transformPage(currentPage, { skip, limit: perPage, total })
    }

    const totalPages = Math.max(1, perPage > 0 ? Math.ceil(total / perPage) : 1)
    let finalCurrentPage = currentPage

    if (finalCurrentPage > totalPages) {
      finalCurrentPage = totalPages
    }
    if (finalCurrentPage < 1) {
      finalCurrentPage = 1
    }

    const hasNextPage = finalCurrentPage < totalPages
    const nextPage = hasNextPage ? finalCurrentPage + 1 : null
    const hasPreviousPage = finalCurrentPage > 1
    const prevPage = hasPreviousPage ? finalCurrentPage - 1 : null

    return {
      data: Array.isArray(data) ? (data as T[]) : [],
      meta: {
        currentPage: finalCurrentPage,
        perPage,
        nextPage,
        prevPage,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    }
  }

  /**
   * Map infinite list response with cursor metadata.
   * hasNextPage/hasPreviousPage are derived from cursor values.
   */
  mapInfinite<T, C = Cursor>(payload: unknown): InfiniteResponse<T, C> {
    const items = resolvePath(payload, this.config.infiniteItemsPath, [])

    let nextCursor = resolvePath<any, C | undefined>(
      payload,
      this.config.infiniteNextCursorPath,
      undefined
    )
    let previousCursor = resolvePath<any, C | undefined>(
      payload,
      this.config.infinitePrevCursorPath,
      undefined
    )

    // Apply cursor transformation if needed
    if (this.config.transformCursor) {
      if (nextCursor !== undefined) {
        nextCursor = this.config.transformCursor(nextCursor) as C
      }
      if (previousCursor !== undefined) {
        previousCursor = this.config.transformCursor(previousCursor) as C
      }
    }

    return {
      items: Array.isArray(items) ? (items as T[]) : [],
      nextCursor,
      previousCursor,
    }
  }

  /**
   * Map single item response.
   */
  mapItem<T>(payload: unknown, dataPath?: string | ((p: any) => T)): T {
    const resolver = dataPath ?? this.config.itemDataPath
    return resolvePath(payload, resolver as PathResolver<any, T>, payload as T)
  }
}
