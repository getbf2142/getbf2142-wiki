/** Trailing slashes stripped so `/foo/` and `/foo` compare equal. */
export const normalizeHref = (href: string) => href.replace(/\/$/, '') || '/';

export const isExternalHref = (href: string) => /^https?:/.test(href);
