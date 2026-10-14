export const DECK = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'] as const;
export const NUMERIC_CARDS = ['0', '1', '2', '3', '5', '8', '13', '21'] as const;

export const ROOM_ID_BYTES = 8;
export const TOKEN_BYTES = 16;

export const ROOM_TTL_MS = 2 * 60 * 60 * 1000;
export const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_ROOMS = 5000;
export const MAX_PARTICIPANTS = 20;
export const OFFLINE_REMOVE_MS = 15 * 60 * 1000;
export const FACILITATOR_GRACE_MS = 30 * 1000;

export const RATE_WINDOW_MS = 60 * 1000;
export const RATE_CREATE_MAX = 5;
export const RATE_JOIN_MAX = 10;
export const RATE_GIF_ROOM_MAX = 10;

export const GIF_URL_MAX = 500;
export const GIF_SHOW_MS = 4000;
export const GIF_LOAD_TIMEOUT_MS = 5000;
export const GIF_COOLDOWN_MS = 10_000;

export const NAME_MAX = 24;
export const MAX_STORIES = 200;
export const STORY_TITLE_MAX = 120;
export const STORY_DESC_MAX = 500;

/** En düşük ve en yüksek sayısal oy arasında destede en az bu kadar adım varsa "dağınık". */
export const DISPERSION_MIN_STEPS = 3;

export const AVATAR_COLORS = ['#6C4DF5', '#D9480F', '#0B7A75', '#B0306A', '#3B6FD4', '#7A5A00', '#2F7D32', '#8E3FBF'] as const;
