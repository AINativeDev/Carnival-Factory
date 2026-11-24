/**
 * The booth owners' avatars, downloaded at build time so visitors make no
 * requests to GitHub (scripts/download-avatars.ts). Plain functions.
 */

/** A GitHub login: letters, digits and single hyphens, at most 39 characters. */
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/** Whether a booth's folder name is a login worth asking GitHub for. */
export const isLogin = (name: string) => LOGIN.test(name);

/** The largest avatar kept, in bytes: a 128 pixel avatar is far smaller. */
export const AVATAR_MAX_BYTES = 200 * 1024;

/** Where GitHub serves a login's avatar, 128 pixels square. */
export const avatarUrl = (login: string) =>
  `https://github.com/${encodeURIComponent(login)}.png?size=128`;

/** Whether the bytes GitHub answered with are a PNG, a JPEG or a GIF, and small enough to keep. */
export function isAvatar(bytes: Uint8Array): boolean {
  if (bytes.length < 8 || bytes.length > AVATAR_MAX_BYTES) return false;
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, n) => bytes[n] === b);
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const gif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  return png || jpeg || gif;
}
