export const ROOM_SPEC_VERSION = 6;

export const villageKeys = {
  payload: (slug: string) => `/api/village/${slug}`,
};

export const roomSpecKeys = {
  detail: (slug: string, cellId: string, ai = false) =>
    `/api/room?v=${ROOM_SPEC_VERSION}&slug=${encodeURIComponent(slug)}&cell=${encodeURIComponent(cellId)}${ai ? '&ai=1' : ''}`,
};
