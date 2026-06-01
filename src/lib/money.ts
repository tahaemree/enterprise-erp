import { Decimal } from "@prisma/client/runtime/library"

/**
 * Money Pattern — Precision Financial Calculations
 *
 * Wraps Prisma's Decimal type to eliminate floating-point errors in financial operations.
 * All monetary values MUST use this class for arithmetic; never use raw JavaScript numbers.
 *
 * ⚠️ CRITICAL RULES:
 * 1. NEVER use `toNumber()` for calculations — it loses precision for values > 2^53
 * 2. ALWAYS use `getValue()` to get the Decimal for Prisma queries
 * 3. ALWAYS call `round(2)` after multiplication/division to prevent precision creep
 * 4. Display values: use `format()` for strings, `toNumber()` ONLY for Chart.js / Recharts
 *
 * Usage:
 *   const price = new Money("99.99")
 *   const tax = price.percentage(18)
 *   const total = price.add(tax).round(2)
 *   console.log(total.format()) // "117.99"
 */
export class Money {
    private value: Decimal

    /**
     * @param value — Accepts number, string, Decimal, or Money
     *                Use string for precision (e.g., "99.99" instead of 99.99)
     */
    constructor(value: number | string | Decimal | Money) {
        if (value instanceof Money) {
            this.value = value.getValue()
        } else {
            this.value = new Decimal(value)
        }
    }

    /** Addition — safe for financial values */
    add(amount: number | string | Decimal | Money): Money {
        const valueToAdd = amount instanceof Money ? amount.getValue() : new Decimal(amount)
        return new Money(this.value.plus(valueToAdd))
    }

    /** Subtraction — safe for financial values */
    subtract(amount: number | string | Decimal | Money): Money {
        const valueToSubtract = amount instanceof Money ? amount.getValue() : new Decimal(amount)
        return new Money(this.value.minus(valueToSubtract))
    }

    /** Multiplication — use with caution, ALWAYS round after */
    multiply(multiplier: number | string | Decimal | Money): Money {
        const factor = multiplier instanceof Money ? multiplier.getValue() : new Decimal(multiplier)
        return new Money(this.value.times(factor))
    }

    /** Division — use with caution, ALWAYS round after */
    divide(divisor: number | string | Decimal | Money): Money {
        const factor = divisor instanceof Money ? divisor.getValue() : new Decimal(divisor)
        if (factor.isZero()) {
            throw new Error('Division by zero in Money operation')
        }
        return new Money(this.value.dividedBy(factor))
    }

    /**
     * Percentage calculation (e.g., 18 for 18% VAT)
     * Formula: value * rate / 100
     * Result is automatically rounded to 2 decimal places.
     */
    percentage(rate: number | string | Decimal): Money {
        return new Money(
            this.value.times(new Decimal(rate)).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        )
    }

    /**
     * Round to specified decimal places using HALF_UP (Türkiye standardı)
     * @param places — Default 2 for Turkish Lira
     */
    round(places: number = 2): Money {
        return new Money(this.value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP))
    }

    /**
     * Get the underlying Decimal value (for Prisma queries)
     */
    getValue(): Decimal {
        return this.value
    }

    /**
     * Format as string with fixed decimal places (e.g., "1,250.50")
     * @param places — Default 2
     */
    format(places: number = 2): string {
        return this.value.toFixed(places)
    }

    /**
     * Convert to JavaScript number.
     *
     * ⚠️ WARNING: Only use for display purposes (charts, tables).
     * NEVER use this for financial calculations or comparisons.
     * For values > 2^53 (9 quadrillion), precision will be lost.
     */
    toNumber(): number {
        return this.value.toNumber()
    }

    /**
     * Comparison: greater than
     */
    gt(other: number | string | Decimal | Money): boolean {
        const otherVal = other instanceof Money ? other.getValue() : new Decimal(other)
        return this.value.greaterThan(otherVal)
    }

    /**
     * Comparison: less than
     */
    lt(other: number | string | Decimal | Money): boolean {
        const otherVal = other instanceof Money ? other.getValue() : new Decimal(other)
        return this.value.lessThan(otherVal)
    }

    /**
     * Comparison: equal to (within precision)
     */
    equals(other: number | string | Decimal | Money): boolean {
        const otherVal = other instanceof Money ? other.getValue() : new Decimal(other)
        return this.value.equals(otherVal)
    }

    /**
     * Is zero?
     */
    isZero(): boolean {
        return this.value.isZero()
    }

    /**
     * Is negative?
     */
    isNegative(): boolean {
        return this.value.isNegative()
    }

    /**
     * Absolute value
     */
    abs(): Money {
        return new Money(this.value.abs())
    }

    /**
     * Negate (multiply by -1)
     */
    negate(): Money {
        return new Money(this.value.negated())
    }

    /**
     * Returns a JSON-safe representation (string, not number!)
     */
    toJSON(): string {
        return this.value.toString()
    }
}
