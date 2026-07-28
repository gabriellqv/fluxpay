/**
 * Centralized cache key generators.
 *
 * Using a key factory instead of raw strings ensures consistency across
 * the codebase and makes it easy to change the key format later.
 *
 * The `userHistoryPattern` key is used for pattern-based invalidation
 * after a new transaction is created, clearing all cached history pages
 * for a given user regardless of page/limit parameters.
 */
export const cacheKeys = {
  userProfile: (userId: string) => `user:${userId}:profile`,
  userHistory: (userId: string, page: number, limit: number, type?: string) =>
    `user:${userId}:history:page:${page}:limit:${limit}${type ? `:type:${type}` : ''}`,
  userHistoryPattern: (userId: string) => `user:${userId}:history:*`,
};
