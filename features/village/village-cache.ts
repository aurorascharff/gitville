export const villageKeys = {
  payload: (slug: string) => `/api/village/${slug}`,
};

export const roomSpecKeys = {
  detail: (slug: string, cellId: string, ai = false) =>
    `/api/room?v=2&slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}${ai ? '&ai=1' : ''}`,
};
