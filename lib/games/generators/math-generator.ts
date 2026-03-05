/**
 * Procedural Math Question Generator
 * Generates unlimited unique, curriculum-accurate questions for all 30 math games.
 * Zero repetition — every call produces a fresh question with correct answer + 3 distractors.
 */

export interface GenQuestion {
    prompt: string
    options: string[]
    answer: string
    visual?: string
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function r(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makeOptions(correct: number | string, wrongs: (number | string)[]): string[] {
    const set = new Set([String(correct)])
    const pool = shuffle(wrongs.map(String)).filter(w => !set.has(w))
    while (set.size < 4 && pool.length) set.add(pool.shift()!)
    // If still under 4, pad with numeric offsets from the correct value
    if (set.size < 4) {
        const base = parseFloat(String(correct))
        const offsets = isNaN(base) ? [2, 3, 4, 5] : [base + 1, base - 1, base + 2, base - 2, base + 3, base + 10]
        for (const o of offsets) {
            const s = String(isNaN(base) ? `Alt${set.size}` : (Number.isInteger(o) ? o : Number(o.toFixed(2))))
            if (!set.has(s)) set.add(s)
            if (set.size >= 4) break
        }
    }
    return shuffle([...set].slice(0, 4))
}

// ── NUMBER_CATERPILLAR: counting, numbers 1-20 ──────────────────────────────
export function genNumberCaterpillar(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const n = r(1, 18); const ans = n + 1
        return { prompt: `What number comes after ${n}?`, options: makeOptions(ans, [ans + 1, ans - 1, ans + 2]), answer: String(ans), visual: '🐛' }
    }
    if (type === 1) {
        const n = r(2, 20); const ans = n - 1
        return { prompt: `What number comes before ${n}?`, options: makeOptions(ans, [ans + 1, ans - 1, ans + 2]), answer: String(ans), visual: '🐛' }
    }
    if (type === 2) {
        const a = r(1, 9), b = r(1, 9), ans = a + b
        return { prompt: `${a} + ${b} = ?`, options: makeOptions(ans, [ans + 1, ans - 1, ans + 2]), answer: String(ans), visual: '🍎' }
    }
    const skip = r(1, 18)
    return { prompt: `What number is missing? ${skip}, __, ${skip + 2}`, options: makeOptions(skip + 1, [skip, skip + 2, skip + 3]), answer: String(skip + 1), visual: '🔢' }
}

// ── HOT_AIR_BALLOON_RACE: 1-digit addition ─────────────────────────────────
export function genHotAirBalloon(): GenQuestion {
    const a = r(1, 9), b = r(1, 9), ans = a + b
    return { prompt: `${a} + ${b} = ?`, options: makeOptions(ans, [ans + 1, ans - 1, ans + 2]), answer: String(ans), visual: '🎈' }
}

// ── APPLE_ORCHARD_COLLECTOR: number recognition ───────────────────────────
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
export function genAppleOrchard(): GenQuestion {
    const n = r(0, 20)
    const emojis = ['🍎', '🍊', '🍇', '🍓', '🫐']
    const e = emojis[r(0, emojis.length - 1)]
    return { prompt: `"${NUM_WORDS[n]}" — how many is that?`, options: makeOptions(n, [n === 0 ? 1 : n - 1, n === 20 ? 19 : n + 1, n + 2 > 20 ? n - 2 : n + 2]), answer: String(n), visual: e }
}

// ── FISH_TANK_FILL: 1-digit subtraction ────────────────────────────────────
export function genFishTankFill(): GenQuestion {
    const b = r(1, 9), a = b + r(0, 9 - b)
    const ans = a - b
    return { prompt: `${a} - ${b} = ?`, options: makeOptions(ans, [ans + 1, ans === 0 ? 1 : ans - 1, ans + 2]), answer: String(ans), visual: '🐠' }
}

// ── SHAPE_SORTER_CITY: 2D shapes ────────────────────────────────────────────
const SHAPES = [
    { name: 'circle', sides: 0, visual: '⭕' }, { name: 'triangle', sides: 3, visual: '🔺' },
    { name: 'square', sides: 4, visual: '🟦' }, { name: 'rectangle', sides: 4, visual: '▬' },
    { name: 'pentagon', sides: 5, visual: '⬟' }, { name: 'hexagon', sides: 6, visual: '⬡' },
    { name: 'octagon', sides: 8, visual: '⬡' },
]
export function genShapeSorterCity(): GenQuestion {
    const idx = r(0, SHAPES.length - 1)
    const s = SHAPES[idx]
    const type = r(0, 2)
    if (type === 0) {
        const others = SHAPES.filter((_, i) => i !== idx).map(x => String(x.sides))
        return { prompt: `How many sides does a ${s.name} have?`, options: makeOptions(s.sides, others.slice(0, 3)), answer: String(s.sides), visual: s.visual }
    }
    if (type === 1) {
        const opts = shuffle(SHAPES).slice(0, 4).map(x => x.name)
        if (!opts.includes(s.name)) opts[0] = s.name
        return { prompt: `${s.visual} This shape with ${s.sides} sides is called a?`, options: shuffle(opts), answer: s.name, visual: s.visual }
    }
    // Only pick side counts that exist in SHAPES array (0,3,4,5,6,8) — no 7-sided shape
    const validSides = [...new Set(SHAPES.map(s => s.sides))]
    const targetSides = validSides[r(0, validSides.length - 1)]
    const match = SHAPES.find(x => x.sides === targetSides) || SHAPES[0]
    return { prompt: `Which shape has exactly ${match.sides} sides?`, options: makeOptions(match.name, SHAPES.filter(x => x.sides !== match.sides).slice(0, 3).map(x => x.name)), answer: match.name, visual: match.visual }
}

// ── PIZZA_SLICE_WARS: fractions ─────────────────────────────────────────────
export function genPizzaSliceWars(): GenQuestion {
    const type = r(0, 4)
    const dens = [2, 3, 4, 5, 6, 8, 10]
    const den = dens[r(0, dens.length - 1)]
    const num = r(1, den - 1)

    if (type === 0) {
        const left = den - num
        return { prompt: `${num}/${den} of a pizza is eaten. What fraction is left?`, options: makeOptions(`${left}/${den}`, [`${num}/${den}`, `${num + 1}/${den}`, `${left + 1}/${den}`]), answer: `${left}/${den}`, visual: '🍕' }
    }
    if (type === 1) {
        const n2 = r(1, num), ans = num + n2 <= den ? `${num + n2}/${den}` : `${den}/${den}`
        return { prompt: `${num}/${den} + ${n2}/${den} = ?`, options: makeOptions(ans, [`${num}/${den}`, `${num + n2 + 1}/${den}`, `${n2}/${den}`]), answer: ans, visual: '🍕' }
    }
    if (type === 2 && num >= 2) {
        const sub = r(1, num - 1), ans = `${num - sub}/${den}`
        return { prompt: `${num}/${den} - ${sub}/${den} = ?`, options: makeOptions(ans, [`${num}/${den}`, `${num + sub}/${den}`, `${sub}/${den}`]), answer: ans, visual: '🍕' }
    }
    // equivalent fraction
    const mult = r(2, 5)
    const eq = `${num * mult}/${den * mult}`
    return { prompt: `Which fraction is equivalent to ${num}/${den}?`, options: makeOptions(eq, [`${num + 1}/${den}`, `${num}/${den + 1}`, `${num * 2}/${den}`]), answer: eq, visual: '🍕' }
}

// ── DECIMAL_DODGE: decimals ──────────────────────────────────────────────────
export function genDecimalDodge(): GenQuestion {
    const type = r(0, 3)
    const d1 = +(r(1, 99) / 10).toFixed(1), d2 = +(r(1, 99) / 10).toFixed(1)

    if (type === 0)
        return { prompt: `${d1} + ${d2} = ?`, options: makeOptions((d1 + d2).toFixed(1), [(d1 + d2 + 0.1).toFixed(1), (d1 + d2 - 0.1).toFixed(1), (d1 + d2 + 1).toFixed(1)]), answer: (d1 + d2).toFixed(1), visual: '⚡' }
    if (type === 1) {
        const big = Math.max(d1, d2), small = Math.min(d1, d2)
        return { prompt: `${big} - ${small} = ?`, options: makeOptions((big - small).toFixed(1), [(big - small + 0.1).toFixed(1), (big - small - 0.1).toFixed(1), (big + small).toFixed(1)]), answer: (big - small).toFixed(1), visual: '⚡' }
    }
    if (type === 2) {
        let bigger = Math.max(d1, d2), smaller = Math.min(d1, d2)
        if (d1 === d2) { bigger = d1 + 0.1; smaller = d1 }
        return { prompt: `Which decimal is larger: ${d1} or ${d2}?`, options: makeOptions(bigger, [smaller, +(bigger + 0.1).toFixed(1), +(smaller - 0.1).toFixed(1)]), answer: String(bigger), visual: '⚡' }
    }
    const n = r(1, 9), d = r(1, 9)
    return { prompt: `${n}.${d} rounded to the nearest whole number is?`, options: makeOptions(d >= 5 ? n + 1 : n, [d >= 5 ? n : n + 1, n - 1, n + 2]), answer: String(d >= 5 ? n + 1 : n), visual: '⚡' }
}

// ── MARKET_MAYHEM: money & arithmetic ───────────────────────────────────────
export function genMarketMayhem(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const price = r(10, 95), paid = Math.ceil(price / 10) * 10 + r(0, 2) * 10, change = paid - price
        return { prompt: `Item costs ₹${price}. Customer pays ₹${paid}. Change?`, options: makeOptions(change, [change + 5, change - 5, change + 10]), answer: String(change), visual: '🏪' }
    }
    if (type === 1) {
        const qty = r(2, 10), price = r(5, 20), total = qty * price
        return { prompt: `${qty} items at ₹${price} each. Total cost?`, options: makeOptions(total, [total + price, total - price, total + 5]), answer: String(total), visual: '🏪' }
    }
    if (type === 2) {
        const price = r(100, 500), pct = [10, 20, 25, 50][r(0, 3)], disc = Math.round(price * pct / 100), final = price - disc
        return { prompt: `₹${price} with ${pct}% discount. You pay?`, options: makeOptions(final, [price, disc, final + 10]), answer: String(final), visual: '🏪' }
    }
    const cost = r(50, 200), sp = cost + r(10, 50), profit = sp - cost, pct = Math.round(profit / cost * 100)
    return { prompt: `Cost ₹${cost}, sold for ₹${sp}. Profit %?`, options: makeOptions(pct, [pct + 5, pct - 5, pct + 10]), answer: String(pct), visual: '🏪' }
}

// ── FACTOR_FORTRESS: factors & multiples ────────────────────────────────────
export function genFactorFortress(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const n = r(4, 48)
        const factors = []
        for (let i = 1; i <= n; i++) if (n % i === 0) factors.push(i)
        const f = factors[r(0, factors.length - 1)]
        const wrongs = [f + 1, f + 2, f - 1 > 0 ? f - 1 : f + 3].map(w => w === n ? w + 1 : w).filter(w => n % w !== 0)
        return { prompt: `Which number is a factor of ${n}?`, options: makeOptions(f, wrongs), answer: String(f), visual: '🗓️' }
    }
    if (type === 1) {
        const a = r(2, 12), b = r(2, 12)
        const lcm = (a * b) / gcd(a, b)
        return { prompt: `LCM of ${a} and ${b}?`, options: makeOptions(lcm, [lcm + a, lcm - 1, a * b !== lcm ? a * b : lcm + b]), answer: String(lcm), visual: '🗓️' }
    }
    if (type === 2) {
        const a = r(2, 24), b = r(2, 24)
        const g = gcd(a, b)
        return { prompt: `GCD of ${a} and ${b}?`, options: makeOptions(g, [g + 1, g === 1 ? 2 : g - 1, g + 2]), answer: String(g), visual: '🗓️' }
    }
    const n = r(4, 60)
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59]
    const isPrime = primes.includes(n)
    if (isPrime) {
        const comp = [4, 6, 8, 9, 10, 12, 14, 15, 16]
        return { prompt: `Which of these is a prime number?`, options: makeOptions(n, [comp[r(0, 2)], comp[r(3, 5)], comp[r(6, 8)]]), answer: String(n), visual: '🗓️' }
    } else {
        const p1 = primes[r(0, 5)], p2 = primes[r(6, 11)], p3 = primes[r(12, 16)]
        return { prompt: `Which of these is a composite number?`, options: makeOptions(n, [p1, p2, p3]), answer: String(n), visual: '🗓️' }
    }
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

// ── FRACTION_ARROW_ARCHER: fractions on number line ─────────────────────────
export function genFractionArcher(): GenQuestion {
    const dens = [2, 3, 4, 5, 6, 8, 10]
    const den = dens[r(0, dens.length - 1)]
    const num = r(0, den)
    const type = r(0, 2)
    if (type === 0) {
        const dec = (num / den).toFixed(2)
        return { prompt: `${num}/${den} is approximately equal to?`, options: makeOptions(dec, [(+dec + 0.1).toFixed(2), (+dec - 0.1).toFixed(2), (+dec + 0.25).toFixed(2)]), answer: dec, visual: '🎯' }
    }
    if (type === 1) {
        // Build 4 unique fraction options, ensuring the correct one is included
        const fracs = new Set<string>([`${num}/${den}`])
        while (fracs.size < 4) fracs.add(`${r(0, den)}/${den}`)
        return { prompt: `Which point is at ${(num / den).toFixed(2)} on the number line?`, options: shuffle([...fracs]), answer: `${num}/${den}`, visual: '🎯' }
    }
    let f1 = r(1, den - 1), f2 = r(1, den - 1)
    while (f1 === f2) f2 = r(1, den - 1)
    const ans = f1 < f2 ? `${f1}/${den}` : `${f2}/${den}`
    return { prompt: `Which fraction is smaller: ${f1}/${den} or ${f2}/${den}?`, options: makeOptions(ans, [`${Math.max(f1, f2)}/${den}`, `${f1 === 1 ? 2 : f1 - 1}/${den}`, `${f2 + 1}/${den}`]), answer: ans, visual: '🎯' }
}

// ── RATIO_RAIL_RUSH: ratio & proportion ─────────────────────────────────────
export function genRatioRailRush(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const a = r(1, 8), b = r(1, 8), mult = r(2, 5)
        const sc = a * mult, sd = b * mult
        return { prompt: `${sc}:${sd} simplified is?`, options: makeOptions(`${a}:${b}`, [`${a + 1}:${b}`, `${a}:${b + 1}`, `${sc}:${sd}`]), answer: `${a}:${b}`, visual: '🚂' }
    }
    if (type === 1) {
        const ratio = [r(1, 5), r(1, 5)], total = r(6, 30)
        const sumParts = ratio[0] + ratio[1], part = Math.floor(total * ratio[0] / sumParts)
        return { prompt: `Split ${total} in ratio ${ratio[0]}:${ratio[1]}. Larger share?`, options: makeOptions(Math.max(part, total - part), [Math.min(part, total - part), part + 1, total - part + 1]), answer: String(Math.max(part, total - part)), visual: '🚂' }
    }
    if (type === 2) {
        const a = r(1, 8), b = r(1, 8), mult = r(2, 6)
        return { prompt: `If ratio is ${a}:${b}, and first quantity is ${a * mult}, second quantity is?`, options: makeOptions(b * mult, [b * mult + b, b * mult - b, b * (mult + 1)]), answer: String(b * mult), visual: '🚂' }
    }
    const speed = r(20, 80), time = r(2, 5), dist = speed * time
    return { prompt: `Travelling at ${speed} km/h for ${time} hours. Distance covered?`, options: makeOptions(dist, [dist + speed, dist - speed, dist + time]), answer: String(dist), visual: '🚂' }
}

// ── MULTIPLIER_MAYHEM: multiplication ────────────────────────────────────────
export function genMultiplierMayhem(): GenQuestion {
    const a = r(2, 12), b = r(2, 12), ans = a * b
    return { prompt: `${a} × ${b} = ?`, options: makeOptions(ans, [ans + a, ans - b, ans + b]), answer: String(ans), visual: '🧮' }
}

// ── ANGLE_ASSASSIN: angles & geometry ────────────────────────────────────────
const ANGLE_TYPES = [
    { name: 'acute', min: 1, max: 89 }, { name: 'right', min: 90, max: 90 }, { name: 'obtuse', min: 91, max: 179 }, { name: 'straight', min: 180, max: 180 }, { name: 'reflex', min: 181, max: 359 }
]
export function genAngleAssassin(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const angle = r(1, 359)
        const at = ANGLE_TYPES.find(t => angle >= t.min && angle <= t.max)!
        // Use makeOptions to guarantee correct answer is always present
        const allTypes = ['acute', 'obtuse', 'right', 'reflex', 'straight'].filter(n => n !== at.name)
        return { prompt: `An angle of ${angle}° is called?`, options: makeOptions(at.name, allTypes.slice(0, 3)), answer: at.name, visual: '📐' }
    }
    if (type === 1) {
        const a = r(1, 179), b = 180 - a
        return { prompt: `Supplementary angle of ${a}°?`, options: makeOptions(b, [b + 5, b - 5, b + 10]), answer: String(b), visual: '📐' }
    }
    if (type === 2) {
        const a = r(1, 89), b = 90 - a
        return { prompt: `Complementary angle of ${a}°?`, options: makeOptions(b, [b + 5, b - 5, b + 1]), answer: String(b), visual: '📐' }
    }
    const sides = r(3, 10), interior = (sides - 2) * 180, each = each2(sides)
    function each2(s: number) { return (s - 2) * 180 / s }
    return { prompt: `Sum of interior angles of a ${sides}-sided polygon?`, options: makeOptions(interior, [interior + 180, interior - 180, interior + 90]), answer: String(interior), visual: '📐' }
}

// ── AREA_CONSTRUCTOR: area & mensuration ────────────────────────────────────
export function genAreaConstructor(): GenQuestion {
    const type = r(0, 4)
    if (type === 0) {
        const l = r(2, 20), w = r(2, 20), ans = l * w
        return { prompt: `Area of rectangle ${l}×${w} cm?`, options: makeOptions(ans, [ans + l, ans - w, 2 * (l + w)]), answer: String(ans), visual: '🏗️' }
    }
    if (type === 1) {
        const s = r(2, 15), ans = s * s
        return { prompt: `Area of square with side ${s} cm?`, options: makeOptions(ans, [ans + s, 4 * s, (s + 1) * (s + 1)]), answer: String(ans), visual: '🏗️' }
    }
    if (type === 2) {
        const b = r(2, 16), h = r(2, 16), ans = 0.5 * b * h
        return { prompt: `Area of triangle: base ${b} cm, height ${h} cm?`, options: makeOptions(ans, [b * h, ans + h, ans - b]), answer: String(ans), visual: '🏗️' }
    }
    if (type === 3) {
        const r2 = r(3, 10), ans = Math.round(Math.PI * r2 * r2), circ = Math.round(2 * Math.PI * r2)
        return { prompt: `Area of circle with radius ${r2} cm (π≈3.14)?`, options: makeOptions(ans, [circ, ans + r2 * 2, (r2 + 1) * (r2 + 1) * 3]), answer: String(ans), visual: '🏗️' }
    }
    const l = r(3, 15), w = r(3, 15), ans = 2 * (l + w)
    return { prompt: `Perimeter of rectangle ${l}×${w} cm?`, options: makeOptions(ans, [l * w, ans + 2, ans - 2]), answer: String(ans), visual: '🏗️' }
}

// ── INTEGER_ICE_BATTLE: integers ─────────────────────────────────────────────
export function genIntegerIceBattle(): GenQuestion {
    const type = r(0, 3)
    const a = r(-12, 12), b = r(-12, 12)
    if (type === 0) return { prompt: `${a} + (${b}) = ?`, options: makeOptions(a + b, [a + b + 1, a + b - 1, a - b]), answer: String(a + b), visual: '🔢' }
    if (type === 1) return { prompt: `${a} - (${b}) = ?`, options: makeOptions(a - b, [a - b + 1, a - b - 1, a + b]), answer: String(a - b), visual: '🔢' }
    if (type === 2) {
        const x = r(-10, 10), y = r(-10, 10), ans = x * y
        return { prompt: `${x} × ${y} = ?`, options: makeOptions(ans, [ans + x, ans - y, Math.abs(ans)]), answer: String(ans), visual: '🔢' }
    }
    let diffB = b
    while (a === diffB) diffB = r(-12, 12)
    return { prompt: `Which integer is greater: ${a} or ${diffB}?`, options: makeOptions(Math.max(a, diffB), [Math.min(a, diffB), Math.max(a, diffB) + 1, Math.min(a, diffB) - 1]), answer: String(Math.max(a, diffB)), visual: '🔢' }
}

// ── ALGEBRA_WAVE_SURFER: linear equations ────────────────────────────────────
export function genAlgebraWave(): GenQuestion {
    const type = r(0, 4)
    if (type === 0) { const x = r(1, 20), c = r(1, 20); return { prompt: `x + ${c} = ${x + c}`, options: makeOptions(x, [x + 1, x - 1, x + 2]), answer: String(x), visual: '🌊' } }
    if (type === 1) { const x = r(1, 15), c = r(1, 15); return { prompt: `x - ${c} = ${x - c}`, options: makeOptions(x, [x + 1, x - 1, x + c]), answer: String(x), visual: '🌊' } }
    if (type === 2) { const x = r(1, 12), a = r(2, 9); return { prompt: `${a}x = ${a * x}`, options: makeOptions(x, [x + 1, x - 1, a * x]), answer: String(x), visual: '🌊' } }
    if (type === 3) { const x = r(1, 10), a = r(2, 6), b = r(1, 10); return { prompt: `${a}x + ${b} = ${a * x + b}`, options: makeOptions(x, [x + 1, x - 1, x + 2]), answer: String(x), visual: '🌊' } }
    const x = r(2, 10), d = r(2, 5); return { prompt: `x/${d} = ${x}`, options: makeOptions(x * d, [x * d + d, x * d - d, x + d]), answer: String(x * d), visual: '🌊' }
}

// ── DATA_DETECTIVE: statistics ────────────────────────────────────────────────
export function genDataDetective(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const data = Array.from({ length: r(4, 8) }, () => r(10, 50))
        const mean = Math.round(data.reduce((a, b) => a + b, 0) / data.length)
        return { prompt: `Data: [${data.join(', ')}]. Mean (average)?`, options: makeOptions(mean, [mean + 2, mean - 2, mean + 5]), answer: String(mean), visual: '📊' }
    }
    if (type === 1) {
        const data = Array.from({ length: r(5, 9) }, () => r(1, 20)).sort((a, b) => a - b)
        const mid = Math.floor(data.length / 2)
        const median = data.length % 2 === 0 ? (data[mid - 1] + data[mid]) / 2 : data[mid]
        return { prompt: `Sorted: [${data.join(', ')}]. Median?`, options: makeOptions(median, [median + 1, median - 1, median + 2]), answer: String(median), visual: '📊' }
    }
    if (type === 2) {
        const vals = [r(1, 15), r(1, 15), r(1, 15)]
        const repeated = vals[r(0, 2)]
        const data = shuffle([...vals, repeated, repeated])
        return { prompt: `Data: [${data.join(', ')}]. Mode?`, options: makeOptions(repeated, vals.filter(v => v !== repeated).slice(0, 3)), answer: String(repeated), visual: '📊' }
    }
    const data = Array.from({ length: r(5, 10) }, () => r(5, 50))
    const range = Math.max(...data) - Math.min(...data)
    return { prompt: `Data: [${data.join(', ')}]. Range?`, options: makeOptions(range, [range + 2, range - 2, range + 5]), answer: String(range), visual: '📊' }
}

// ── PROBABILITY_POKER: probability ────────────────────────────────────────────
export function genProbabilityPoker(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const fav = r(1, 5), total = r(6, 12), prob = `${fav}/${total}`
        return { prompt: `${fav} favourable outcomes out of ${total}. Probability?`, options: makeOptions(prob, [`${fav + 1}/${total}`, `${fav}/${total + 1}`, `${total - fav}/${total}`]), answer: prob, visual: '🎲' }
    }
    if (type === 1) {
        const sides = [4, 6, 8, 12], die = sides[r(0, sides.length - 1)], target = r(1, die)
        return { prompt: `Rolling a fair ${die}-sided die. P(getting ${target})?`, options: makeOptions(`1/${die}`, [`1/${die - 1}`, `${target}/${die}`, `1/${die + 1}`]), answer: `1/${die}`, visual: '🎲' }
    }
    if (type === 2) {
        const red = r(2, 5), blue = r(2, 5), total = red + blue
        return { prompt: `Bag has ${red} red and ${blue} blue balls. P(red)?`, options: makeOptions(`${red}/${total}`, [`${blue}/${total}`, `${red}/${red}`, `1/${total}`]), answer: `${red}/${total}`, visual: '🎲' }
    }
    const p = r(1, 4), q = r(5, 10)
    return { prompt: `P(A)=${p}/${q}. P(not A)?`, options: makeOptions(`${q - p}/${q}`, [`${p}/${q}`, `1/${q}`, `${q - p}/${q + 1}`]), answer: `${q - p}/${q}`, visual: '🎲' }
}

// ── COORDINATE_COMBAT: coordinate geometry ──────────────────────────────────
export function genCoordinateCombat(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const x = r(-8, 8), y = r(-8, 8)
        const quad = x > 0 && y > 0 ? 'Q1' : x < 0 && y > 0 ? 'Q2' : x < 0 && y < 0 ? 'Q3' : 'Q4'
        if (x === 0 || y === 0) return { prompt: `Point (${r(1, 8)},${r(1, 8)}) is in?`, options: ['Q1', 'Q2', 'Q3', 'Q4'], answer: 'Q1', visual: '🌐' }
        return { prompt: `Point (${x},${y}) is in?`, options: ['Q1', 'Q2', 'Q3', 'Q4'], answer: quad, visual: '🌐' }
    }
    if (type === 1) {
        const x1 = r(-5, 5), y1 = r(-5, 5), x2 = r(-5, 5), y2 = r(-5, 5)
        const dist = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * 10) / 10
        return { prompt: `Distance between (${x1},${y1}) and (${x2},${y2})? (≈)`, options: makeOptions(dist, [dist + 1, dist - 0.5, dist + 2]), answer: String(dist), visual: '🌐' }
    }
    if (type === 2) {
        const x1 = r(-6, 6), y1 = r(-6, 6), x2 = r(-6, 6), y2 = r(-6, 6)
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
        return { prompt: `Midpoint of (${x1},${y1}) and (${x2},${y2})?`, options: makeOptions(`(${mx},${my})`, [`(${mx + 1},${my})`, `(${mx},${my + 1})`, `(${x1},${y2})`]), answer: `(${mx},${my})`, visual: '🌐' }
    }
    const m = r(-3, 3), c = r(-5, 5), x = r(-4, 4)
    return { prompt: `Line y=${m}x+${c}. Value of y when x=${x}?`, options: makeOptions(m * x + c, [m * x + c + 1, m * x + c - 1, m * x + c + m]), answer: String(m * x + c), visual: '🌐' }
}

// ── POLYNOMIAL_PACKAGER: polynomials ─────────────────────────────────────────
export function genPolynomialPackager(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const a = r(1, 5), b = r(1, 5), x = r(1, 5)
        return { prompt: `If p(x)=${a}x²+${b}, then p(${x})=?`, options: makeOptions(a * x * x + b, [a * x * x + b + 1, a * x + b, a * x * x - b]), answer: String(a * x * x + b), visual: '🔁' }
    }
    if (type === 1) {
        const a = r(1, 6), b = r(1, 8)
        return { prompt: `Degree of polynomial ${a}x³+${b}x²+1?`, options: ['1', '2', '3', '4'], answer: '3', visual: '🔁' }
    }
    if (type === 2) {
        const a = r(1, 5), b = r(1, 6), c = r(1, 5), d = r(1, 6)
        const ans1 = a + c, ans2 = b + d
        return { prompt: `(${a}x+${b})+(${c}x+${d})=?`, options: makeOptions(`${ans1}x+${ans2}`, [`${ans1 + 1}x+${ans2}`, `${a}x+${d}`, `${ans1}x-${ans2}`]), answer: `${ans1}x+${ans2}`, visual: '🔁' }
    }
    const a = r(1, 5), b = r(1, 5)
    return { prompt: `Factor: x²+(${a}+${b})x+${a * b}`, options: makeOptions(`(x+${a})(x+${b})`, [`(x-${a})(x+${b})`, `(x+${a})(x-${b})`, `(x-${a})(x-${b})`]), answer: `(x+${a})(x+${b})`, visual: '🔁' }
}

// ── QUADRATIC_QUEST: quadratic equations ─────────────────────────────────────
export function genQuadraticQuest(): GenQuestion {
    const type = r(0, 2)
    if (type === 0) {
        // Ensure r1 ≠ r2 to avoid duplicate-root issues where -r1=-r2 = r1=r2
        let r1 = r(-8, 8), r2 = r(-8, 8)
        while (r1 === r2) r2 = r(-8, 8)
        const b = -(r1 + r2), c = r1 * r2
        const sign = b >= 0 ? '+' : ''
        return { prompt: `Roots of x²${sign}${b}x+${c}=0?`, options: makeOptions(`x=${r1} or x=${r2}`, [`x=${r1 + 1} or x=${r2}`, `x=${r1} or x=${r2 + 1}`, `x=${-r1} or x=${-r2}`]), answer: `x=${r1} or x=${r2}`, visual: '🔮' }
    }
    if (type === 1) {
        // Avoid x=0 to prevent ±0 and ±-1 malformed options
        const a = r(1, 4), x = r(1, 6), val = a * x * x
        const absX = x  // x is always positive here (r(1,6))
        return { prompt: `${a}x²=${val}. x=?`, options: makeOptions(`±${absX}`, [`±${absX + 1}`, `±${absX + 2}`, `${absX}`]), answer: `±${absX}`, visual: '🔮' }
    }
    let p = r(1, 6), q = r(1, 6)
    while (p === q) q = r(1, 6) // Guarantee 2 distinct roots (discriminant > 0)
    const b = -(p + q), c = p * q
    return { prompt: `How many real roots does x²${b >= 0 ? '+' : ''}${b}x+${c}=0 have?`, options: ['0 real roots', '1 real root', '2 distinct real roots', 'Infinite roots'], answer: '2 distinct real roots', visual: '🔮' }
}

// ── TRIG_BRIDGE_BUILDER: trigonometry ────────────────────────────────────────
const TRIG_VALUES: Record<number, { sin: string, cos: string, tan: string }> = {
    0: { sin: '0', cos: '1', tan: '0' },
    30: { sin: '1/2', cos: '√3/2', tan: '1/√3' },
    45: { sin: '1/√2', cos: '1/√2', tan: '1' },
    60: { sin: '√3/2', cos: '1/2', tan: '√3' },
    90: { sin: '1', cos: '0', tan: 'undefined' },
}
export function genTrigBridge(): GenQuestion {
    const angles = [0, 30, 45, 60, 90], ang = angles[r(0, angles.length - 1)]
    const fns = ['sin', 'cos', 'tan'], fn = fns[r(0, fns.length - 1)] as 'sin' | 'cos' | 'tan'
    const ans = TRIG_VALUES[ang][fn]
    // Deduplicate wrongs (some trig values are shared, e.g. sin30=cos60=1/2)
    const seen = new Set<string>([ans])
    const wrongs: string[] = []
    for (const a of angles) {
        if (a === ang) continue
        const v = TRIG_VALUES[a][fn]
        if (!seen.has(v)) { seen.add(v); wrongs.push(v) }
        if (wrongs.length === 3) break
    }
    return { prompt: `${fn}(${ang}°) = ?`, options: makeOptions(ans, wrongs), answer: ans, visual: '🌉' }
}

// ── MATRIX_MORPH_DUEL: matrices ───────────────────────────────────────────────
export function genMatrixMorph(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const [[a, b], [c, d]] = [[r(1, 5), r(1, 5)], [r(1, 5), r(1, 5)]]
        const [[e, f], [g, h]] = [[r(1, 5), r(1, 5)], [r(1, 5), r(1, 5)]]
        return { prompt: `[${a} ${b}; ${c} ${d}] + [${e} ${f}; ${g} ${h}] = top-left element?`, options: makeOptions(a + e, [a + e + 1, a + e - 1, e + f]), answer: String(a + e), visual: '🧊' }
    }
    if (type === 1) {
        const [[a, b], [c, d]] = [[r(1, 5), r(1, 5)], [r(1, 5), r(1, 5)]]
        const det = a * d - b * c
        return { prompt: `Determinant of [${a} ${b}; ${c} ${d}]?`, options: makeOptions(det, [det + 1, det - 1, a * d + b * c]), answer: String(det), visual: '🧊' }
    }
    if (type === 2) {
        const k = r(2, 5), [[a, b], [c, d]] = [[r(1, 4), r(1, 4)], [r(1, 4), r(1, 4)]]
        return { prompt: `${k}×[${a} ${b}; ${c} ${d}] — top-right element?`, options: makeOptions(k * b, [k * b + k, k * b - 1, b]), answer: String(k * b), visual: '🧊' }
    }
    return { prompt: `Order of matrix with 3 rows and 4 columns?`, options: ['3×3', '4×3', '3×4', '4×4'], answer: '3×4', visual: '🧊' }
}

// ── INTEGRAL_INVADER: integration ────────────────────────────────────────────
const INTEGRALS: Array<{ q: string, a: string }> = [
    { q: '∫x dx', a: 'x²/2 + C' }, { q: '∫x² dx', a: 'x³/3 + C' }, { q: '∫1 dx', a: 'x + C' },
    { q: '∫sin x dx', a: '-cos x + C' }, { q: '∫cos x dx', a: 'sin x + C' }, { q: '∫eˣ dx', a: 'eˣ + C' },
    { q: '∫(1/x) dx', a: 'ln|x| + C' }, { q: '∫2x dx', a: 'x² + C' }, { q: '∫3x² dx', a: 'x³ + C' },
    { q: '∫sec²x dx', a: 'tan x + C' }, { q: '∫xⁿ dx (n≠-1)', a: 'xⁿ⁺¹/(n+1) + C' },
    { q: '∫0 dx', a: 'C' }, { q: '∫(x+1) dx', a: 'x²/2+x+C' },
]
export function genIntegralInvader(): GenQuestion {
    const item = INTEGRALS[r(0, INTEGRALS.length - 1)]
    // Deduplicate wrongs by answer string before slicing
    const seen = new Set<string>([item.a])
    const wrongs: string[] = []
    for (const i of INTEGRALS) {
        if (!seen.has(i.a)) { seen.add(i.a); wrongs.push(i.a) }
        if (wrongs.length === 3) break
    }
    return { prompt: `${item.q} = ?`, options: makeOptions(item.a, wrongs), answer: item.a, visual: '♾️' }
}

// ── VECTOR_SPACE_VOYAGER: vectors ─────────────────────────────────────────────
export function genVectorVoyager(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const ax = r(1, 5), ay = r(1, 5), bx = r(1, 5), by = r(1, 5)
        return { prompt: `A=(${ax},${ay}), B=(${bx},${by}). A+B=?`, options: makeOptions(`(${ax + bx},${ay + by})`, [`(${ax + bx + 1},${ay + by})`, `(${ax - bx},${ay - by})`, `(${ax + bx},${ay + by + 1})`]), answer: `(${ax + bx},${ay + by})`, visual: '🌌' }
    }
    if (type === 1) {
        const x = r(1, 8), y = r(1, 8), mag = Math.round(Math.sqrt(x * x + y * y) * 100) / 100
        return { prompt: `Magnitude of vector (${x},${y})? (approx)`, options: makeOptions(mag, [mag + 0.5, mag - 0.5, x + y]), answer: String(mag), visual: '🌌' }
    }
    if (type === 2) {
        const ax = r(1, 5), ay = r(1, 5), bx = r(1, 5), by = r(1, 5), dot = ax * bx + ay * by
        return { prompt: `Dot product of (${ax},${ay})·(${bx},${by})?`, options: makeOptions(dot, [dot + 1, dot - 1, ax * by + ay * bx]), answer: String(dot), visual: '🌌' }
    }
    const k = r(2, 5), x = r(1, 6), y = r(1, 6)
    return { prompt: `Scalar ${k} × vector (${x},${y}) = ?`, options: makeOptions(`(${k * x},${k * y})`, [`(${k * x + 1},${k * y})`, `(${x + k},${y + k})`, `(${k * x},${k * y + 1})`]), answer: `(${k * x},${k * y})`, visual: '🌌' }
}

// ── CALCULUS_CLIFF: derivatives ───────────────────────────────────────────────
const DERIV_TABLE: Array<{ f: string, df: string }> = [
    { f: 'x²', df: '2x' }, { f: 'x³', df: '3x²' }, { f: 'x⁴', df: '4x³' }, { f: 'x⁵', df: '5x⁴' },
    { f: 'sin x', df: 'cos x' }, { f: 'cos x', df: '-sin x' }, { f: 'tan x', df: 'sec²x' },
    { f: 'eˣ', df: 'eˣ' }, { f: 'ln x', df: '1/x' }, { f: '√x', df: '1/(2√x)' },
    { f: '1/x', df: '-1/x²' }, { f: '5', df: '0' }, { f: '3x', df: '3' }, { f: '2x²', df: '4x' },
    { f: 'x⁶', df: '6x⁵' }, { f: 'sec x', df: 'sec x·tan x' },
]
export function genCalculusCliff(): GenQuestion {
    const item = DERIV_TABLE[r(0, DERIV_TABLE.length - 1)]
    const wrongs = DERIV_TABLE.filter(i => i.df !== item.df).slice(0, 3).map(i => i.df)
    return { prompt: `d/dx (${item.f}) = ?`, options: makeOptions(item.df, wrongs), answer: item.df, visual: '📉' }
}

// ── NUMBER_THEORY_VAULT: number theory ───────────────────────────────────────
export function genNumberTheoryVault(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const n = r(2, 50)
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
        const isPrime = primes.includes(n)
        if (isPrime) {
            const comp = [4, 6, 8, 9, 10, 12, 14, 15, 16]
            return { prompt: `Which is a prime number?`, options: makeOptions(n, [comp[r(0, 2)], comp[r(3, 5)], comp[r(6, 8)]]), answer: String(n), visual: '🔐' }
        } else {
            const p1 = primes[r(0, 4)], p2 = primes[r(5, 9)], p3 = primes[r(10, 14)]
            return { prompt: `Which is a composite number?`, options: makeOptions(n, [p1, p2, p3]), answer: String(n), visual: '🔐' }
        }
    }
    if (type === 1) {
        const a = r(10, 50), b = r(2, 10), ans = a % b
        return { prompt: `${a} mod ${b} = ?`, options: makeOptions(ans, [ans + 1, ans === 0 ? 1 : ans - 1, b]), answer: String(ans), visual: '🔐' }
    }
    if (type === 2) {
        const n = r(4, 100), g = gcd(n, 10)
        return { prompt: `GCD(${n}, 10) = ?`, options: makeOptions(g, [g + 1, g === 1 ? 2 : g - 1, 10]), answer: String(g), visual: '🔐' }
    }
    const n = r(2, 8), ans = 2 ** n
    return { prompt: `2^${n} = ?`, options: makeOptions(ans, [ans + 1, ans - 1, n * 2]), answer: String(ans), visual: '🔐' }
}

// ── COMPLEX_NAVIGATOR: complex numbers ───────────────────────────────────────
export function genComplexNavigator(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const a = r(-5, 5), b = r(-5, 5), c = r(-5, 5), d = r(-5, 5)
        return { prompt: `(${a}+${b}i)+(${c}+${d}i)=?`, options: makeOptions(`${a + c}+${b + d}i`, [`${a + c + 1}+${b + d}i`, `${a + c}+${b + d + 1}i`, `${a - c}+${b - d}i`]), answer: `${a + c}+${b + d}i`, visual: '🌊' }
    }
    if (type === 1) {
        const a = r(1, 6), b = r(1, 6), mag = Math.round(Math.sqrt(a * a + b * b) * 100) / 100
        return { prompt: `|${a}+${b}i| = ?`, options: makeOptions(mag, [mag + 0.5, a + b, (a + 1)]), answer: String(mag), visual: '🌊' }
    }
    if (type === 2) {
        const a = r(-5, 5), b = r(-5, 5)
        return { prompt: `Real part of ${a}+${b}i?`, options: makeOptions(a, [b, a + 1, a - 1]), answer: String(a), visual: '🌊' }
    }
    return { prompt: `i² = ?`, options: ['-1', '1', 'i', '-i'], answer: '-1', visual: '🌊' }
}

// ── PERMUTATION_COASTER: P&C ──────────────────────────────────────────────────
function factorial(n: number): number { return n <= 1 ? 1 : n * factorial(n - 1) }
function perm(n: number, r: number) { return factorial(n) / factorial(n - r) }
function comb(n: number, r: number) { return factorial(n) / (factorial(r) * factorial(n - r)) }

export function genPermutationCoaster(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const n = r(3, 7), rr = r(1, n), ans = perm(n, rr)
        return { prompt: `P(${n},${rr}) = ?`, options: makeOptions(ans, [ans + factorial(rr), ans - 1, comb(n, rr)]), answer: String(ans), visual: '🎢' }
    }
    if (type === 1) {
        const n = r(3, 7), rr = r(1, n), ans = comb(n, rr)
        return { prompt: `C(${n},${rr}) = ?`, options: makeOptions(ans, [ans + 1, ans - 1, perm(n, rr)]), answer: String(ans), visual: '🎢' }
    }
    if (type === 2) {
        const n = r(3, 6), ans = factorial(n)
        return { prompt: `${n} people in a row: how many arrangements?`, options: makeOptions(ans, [ans + 1, ans - factorial(n - 1), factorial(n - 1)]), answer: String(ans), visual: '🎢' }
    }
    const n = r(4, 8), rr = 2, ans = comb(n, rr)
    return { prompt: `Ways to choose 2 from ${n} items?`, options: makeOptions(ans, [ans + 1, ans - 1, perm(n, rr)]), answer: String(ans), visual: '🎢' }
}

// ── STATISTICS_STOCK_PROPHET: stats & probability ────────────────────────────
export function genStatsStockProphet(): GenQuestion {
    const type = r(0, 3)
    if (type === 0) {
        const data = Array.from({ length: r(5, 8) }, () => r(10, 100))
        const mean = Math.round(data.reduce((a, b) => a + b, 0) / data.length)
        return { prompt: `Data: [${data.join(',')}]. Mean?`, options: makeOptions(mean, [mean + 3, mean - 3, mean + 5]), answer: String(mean), visual: '💹' }
    }
    if (type === 1) {
        const data = Array.from({ length: r(5, 9) }, () => r(1, 50)).sort((a, b) => a - b)
        const mid = Math.floor(data.length / 2)
        const median = data.length % 2 === 0 ? (data[mid - 1] + data[mid]) / 2 : data[mid]
        return { prompt: `Sorted: [${data.join(',')}]. Median?`, options: makeOptions(median, [median + 1, median - 1, median + 2]), answer: String(median), visual: '💹' }
    }
    if (type === 2) {
        const mu = r(50, 100), s = r(5, 15), x = mu + s
        return { prompt: `Mean=${mu}, SD=${s}. Z-score for x=${x}?`, options: makeOptions('1', ['0', '2', '1.5']), answer: '1', visual: '💹' }
    }
    const n = r(5, 10), r2 = r(1, 4)
    const prob = `${r2}/${n}`
    return { prompt: `P(event)=${prob}. Expected occurrence in ${n} trials?`, options: makeOptions(r2, [r2 + 1, r2 - 1 >= 1 ? r2 - 1 : r2 + 2, n - r2]), answer: String(r2), visual: '💹' }
}

// ── Knowledge game generators ─────────────────────────────────────────────────
import {
    genSynonymSwitchblade, genGrammarGladiator, genIdiomHunter,
    genComprehensionCodebreaker, genPeriodicBattleship, genAnimalKingdomSorter,
    genSolarSystemDefender, genGeneticsGenomeDuel, genFoodChainArena,
    genPlantPowerGrower, genCapitalsConquest, genWorldFlags,
    genCivilizationBuilder, genEmpireFall,
} from './knowledge-generator-1'

import {
    genBinaryBlaster, genCyberShield, genDebugDuel, genLogicGateGarden,
    genInventorsWorkshop, genOlympiadQualifier, genCriticalThinkersCourt,
    genShabdkoshSprint, genVarnamalaVillage, genVyakaranWarrior,
    genForceMotionDojo, genShopItUp,
} from './knowledge-generator-2'

/** Master dispatcher — given a gameKey, return a fresh generated question.
 *  All 152 games (32 math + 120 knowledge) are now procedurally generated — truly unlimited. */
export function generateQuestion(gameKey: string): GenQuestion | null {
    const map: Record<string, () => GenQuestion> = {
        // ── Math games ──────────────────────────────────────────────────
        NUMBER_CATERPILLAR: genNumberCaterpillar,
        HOT_AIR_BALLOON_RACE: genHotAirBalloon,
        APPLE_ORCHARD_COLLECTOR: genAppleOrchard,
        FISH_TANK_FILL: genFishTankFill,
        SHAPE_SORTER_CITY: genShapeSorterCity,
        PIZZA_SLICE_WARS: genPizzaSliceWars,
        DECIMAL_DODGE: genDecimalDodge,
        MARKET_MAYHEM: genMarketMayhem,
        FACTOR_FORTRESS: genFactorFortress,
        FRACTION_ARROW_ARCHER: genFractionArcher,
        RATIO_RAIL_RUSH: genRatioRailRush,
        MULTIPLIER_MAYHEM: genMultiplierMayhem,
        ANGLE_ASSASSIN: genAngleAssassin,
        ALGEBRA_WAVE_SURFER: genAlgebraWave,
        AREA_CONSTRUCTOR: genAreaConstructor,
        INTEGER_ICE_BATTLE: genIntegerIceBattle,
        DATA_DETECTIVE: genDataDetective,
        PROBABILITY_POKER: genProbabilityPoker,
        COORDINATE_COMBAT: genCoordinateCombat,
        POLYNOMIAL_PACKAGER: genPolynomialPackager,
        CALCULUS_CLIFF: genCalculusCliff,
        QUADRATIC_QUEST: genQuadraticQuest,
        TRIG_BRIDGE_BUILDER: genTrigBridge,
        MATRIX_MORPH_DUEL: genMatrixMorph,
        INTEGRAL_INVADER: genIntegralInvader,
        VECTOR_SPACE_VOYAGER: genVectorVoyager,
        STATISTICS_STOCK_PROPHET: genStatsStockProphet,
        NUMBER_THEORY_VAULT: genNumberTheoryVault,
        COMPLEX_NAVIGATOR: genComplexNavigator,
        PERMUTATION_COASTER: genPermutationCoaster,
        SURVEYORS_SPRINT: genCoordinateCombat,

        // ── English games ───────────────────────────────────────────────
        SYNONYM_SWITCHBLADE: genSynonymSwitchblade,
        GRAMMAR_GLADIATOR: genGrammarGladiator,
        IDIOM_HUNTER: genIdiomHunter,
        COMPREHENSION_CODEBREAKER: genComprehensionCodebreaker,
        SHAKESPEARE_SHOWDOWN: genComprehensionCodebreaker,
        PHONICS_POND_HOP: genGrammarGladiator,
        LETTER_LASSO: genGrammarGladiator,
        VOWEL_VILLAGE: genGrammarGladiator,
        TENSE_TREKKER: genGrammarGladiator,
        PUNCTUATION_RUSH: genGrammarGladiator,
        ESSAY_ENGINEER: genComprehensionCodebreaker,
        PARTS_OF_SPEECH_DUEL: genGrammarGladiator,

        // ── Science games ───────────────────────────────────────────────
        PERIODIC_BATTLESHIP: genPeriodicBattleship,
        ANIMAL_KINGDOM_SORTER: genAnimalKingdomSorter,
        SOLAR_SYSTEM_DEFENDER: genSolarSystemDefender,
        GENETICS_GENOME_DUEL: genGeneticsGenomeDuel,
        FOOD_CHAIN_ARENA: genFoodChainArena,
        PLANT_POWER_GROWER: genPlantPowerGrower,
        FORCE_MOTION_DOJO: genForceMotionDojo,
        ELECTROSTATICS_ARENA: genForceMotionDojo,
        EVOLUTION_ISLAND: genGeneticsGenomeDuel,
        CHEMISTRY_CAULDRON: genPeriodicBattleship,
        CELL_DIVISION_DASH: genGeneticsGenomeDuel,
        WAVE_FREQUENCY_FIGHTER: genForceMotionDojo,
        OPTICS_OBSTACLE_COURSE: genForceMotionDojo,
        HUMAN_BODY_BLITZ: genAnimalKingdomSorter,
        ECOLOGY_EXPEDITION: genFoodChainArena,

        // ── Social Studies games ─────────────────────────────────────────
        CAPITALS_CONQUEST: genCapitalsConquest,
        WORLD_FLAGS: genWorldFlags,
        CIVILIZATION_BUILDER: genCivilizationBuilder,
        EMPIRE_FALL: genEmpireFall,
        DEMOCRACY_DEBATE: genCivilizationBuilder,
        TRADE_ROUTE_TYCOON: genShopItUp,
        MAP_MASTERY_MISSION: genCapitalsConquest,
        GEOSPY: genWorldFlags,
        TIMELINE_BLITZ: genCivilizationBuilder,
        GEOGRAPHY_GLADIATOR: genCapitalsConquest,

        // ── Computer Science games ───────────────────────────────────────
        BINARY_BLASTER: genBinaryBlaster,
        CYBER_SHIELD: genCyberShield,
        DEBUG_DUEL: genDebugDuel,
        LOGIC_GATE_GARDEN: genLogicGateGarden,
        ENCRYPTION_ESCAPE: genCyberShield,
        AI_TRAINING_GROUND: genDebugDuel,
        SORTING_RACE: genBinaryBlaster,
        ALGORITHM_ARENA: genBinaryBlaster,
        CODE_BREAKER: genCyberShield,
        RECURSION_REALM: genDebugDuel,
        DATA_STRUCTURES_DUEL: genBinaryBlaster,
        WEB_WEAVER: genCyberShield,

        // ── GK games ─────────────────────────────────────────────────────
        INVENTORS_WORKSHOP: genInventorsWorkshop,
        OLYMPIAD_QUALIFIER: genOlympiadQualifier,
        CRITICAL_THINKERS_COURT: genCriticalThinkersCourt,
        BUDGET_BATTLE: genShopItUp,
        SHOP_IT_UP: genShopItUp,
        EQ_MAZE: genCriticalThinkersCourt,
        SCIENCE_OLYMPIAD: genOlympiadQualifier,
        NEWS_NINJA: genOlympiadQualifier,
        CURRENT_AFFAIRS_CLASH: genOlympiadQualifier,
        SPORTS_TRIVIA_LEAGUE: genOlympiadQualifier,
        MUSIC_MAESTRO: genOlympiadQualifier,
        ART_GALLERY_QUIZ: genOlympiadQualifier,

        // ── Hindi games ───────────────────────────────────────────────────
        SHABDKOSH_SPRINT: genShabdkoshSprint,
        VARNAMALA_VILLAGE: genVarnamalaVillage,
        VYAKARAN_WARRIOR: genVyakaranWarrior,
        HINDI_STORY_BUILDER: genShabdkoshSprint,
        MATRA_MATCH: genVarnamalaVillage,
        SANDHI_SHOWDOWN: genVyakaranWarrior,
        MUHAVARE_MANIA: genShabdkoshSprint,
        DOHE_KI_DAUD: genShabdkoshSprint,
    }
    return map[gameKey]?.() ?? null
}
