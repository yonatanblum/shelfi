export const ROUTES = {
  dashboard: "/",
  upload: "/upload",
  analysisDetail: (id: string) => `/analysis/${id}`,
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
