import { convertCents } from '../src/lib/exchange'

function assertEqual(a: any, b: any, msg?: string) {
  if (a !== b) throw new Error(`Assertion failed: ${a} !== ${b}. ${msg ?? ''}`)
}

// $100.00 -> 10000 cents, rate 30.123 -> expected in EGP: 3012.3 -> rounded to 3012 cents? considering 2 decimals -> 301230 cents? Wait, convertCents returns cents of target currency.
// Let's test with simple values
const c1 = convertCents(10000, 1.0, 2) // USD->USD
assertEqual(c1, 10000, 'USD->USD should be identical')

const c2 = convertCents(10000, 30.123, 2) // $100 -> 3012.3 -> 3012.3 => rounds to 301230 cents? Actually convertCents divides by 100, multiplies by rate, then rounds to decimals, then multiplies by 100.
// Calculated: 10000/100 = 100; 100*30.123 = 3012.3; round to 2 decimals -> 3012.3 -> *100 = 301230
assertEqual(c2, 301230, 'USD->EGP conversion')

console.log('All tests passed')
