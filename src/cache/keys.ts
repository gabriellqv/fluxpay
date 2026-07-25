export const cacheKeys = {
  userBalance: (userId: string) => `user:${userId}:balance`,
  userHistory: (userId: string, page: number, limit: number) =>
    `user:${userId}:history:page:${page}:limit:${limit}`,
  userHistoryPattern: (userId: string) => `user:${userId}:history:*`,
};
