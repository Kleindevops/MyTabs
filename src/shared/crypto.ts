// Web Crypto API AES-256-GCM + PBKDF2 client-side zero-knowledge encryption

export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(plaintext: string, password: string, salt: string): Promise<string> {
  const key = await deriveKey(password, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const encoded = enc.encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )

  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)

  // Convert to Base64
  let binary = ''
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i])
  }
  return btoa(binary)
}

export async function decryptText(encryptedBase64: string, password: string, salt: string): Promise<string> {
  const binary = atob(encryptedBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const iv = bytes.slice(0, 12)
  const ciphertext = bytes.slice(12)
  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  const dec = new TextDecoder()
  return dec.decode(decrypted)
}

const VERIFIER_KEYWORD = '__MYTABS_VAULT_UNLOCK_OK__'

export async function createVaultVerifier(password: string, salt: string): Promise<string> {
  return encryptText(VERIFIER_KEYWORD, password, salt)
}

export async function verifyVaultPassword(password: string, salt: string, verifier: string): Promise<boolean> {
  try {
    const text = await decryptText(verifier, password, salt)
    return text === VERIFIER_KEYWORD
  } catch {
    return false
  }
}
