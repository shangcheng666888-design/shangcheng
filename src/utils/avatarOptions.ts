export const AVATAR_STORAGE_KEY = 'accountAvatarUrl'

export const AVATAR_OPTIONS = [
  ...Array.from({ length: 15 }, (_, i) => `/avatars/avatar${i + 1}.png`),
  '/avatars/avatar18.png',
  '/avatars/avatar19.png',
  '/avatars/avatar20.png',
  '/avatars/avatar21.png',
  '/avatars/avatar22.png',
]

export function getRandomAvatar(): string {
  const i = Math.floor(Math.random() * AVATAR_OPTIONS.length)
  return AVATAR_OPTIONS[i]!
}
