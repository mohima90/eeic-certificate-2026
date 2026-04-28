import Hashids from 'hashids'

// Must match Laravel config/hashids.php: salt="" length=0
const hashids = new Hashids(
  process.env.HASHIDS_SALT ?? '',
  Number(process.env.HASHIDS_LENGTH ?? 0)
)

export function encode(id: number): string {
  return hashids.encode(id)
}

export function decode(hash: string): number | null {
  const decoded = hashids.decode(hash)
  if (!decoded.length) return null
  return decoded[0] as number
}
