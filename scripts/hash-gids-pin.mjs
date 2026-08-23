#!/usr/bin/env node
import { randomBytes, scryptSync } from 'crypto'

const pin = String(process.argv[2] ?? '123456').trim()
if (!/^\d{6}$/.test(pin)) {
  console.error('Gebruik: node scripts/hash-gids-pin.mjs 123456')
  process.exit(1)
}
const salt = randomBytes(16).toString('hex')
const hash = scryptSync(pin, salt, 32).toString('hex')
console.log(`scrypt:${salt}:${hash}`)
