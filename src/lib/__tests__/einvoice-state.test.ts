import { describe, expect, it } from "vitest"
import {
    canTransitionEInvoice,
    assertEInvoiceTransition,
    EINVOICE_TRANSITIONS,
} from "@/lib/einvoice-state"
import { ConflictError } from "@/lib/errors"

describe("e-Invoice state machine", () => {
    it("allows the happy-path send flow", () => {
        expect(canTransitionEInvoice("DRAFT", "SENDING")).toBe(true)
        expect(canTransitionEInvoice("SENDING", "SENT_TO_GIB")).toBe(true)
        expect(canTransitionEInvoice("SENDING", "GIB_ACCEPTED")).toBe(true)
        expect(canTransitionEInvoice("SENT_TO_GIB", "GIB_ACCEPTED")).toBe(true)
    })

    it("allows error recovery and rejection re-edit", () => {
        expect(canTransitionEInvoice("ERROR", "SENDING")).toBe(true)
        expect(canTransitionEInvoice("GIB_REJECTED", "DRAFT")).toBe(true)
        expect(canTransitionEInvoice("GIB_WARNING", "GIB_ACCEPTED")).toBe(true)
    })

    it("treats GIB_ACCEPTED and CANCELLED as terminal", () => {
        expect(EINVOICE_TRANSITIONS.GIB_ACCEPTED).toHaveLength(0)
        expect(EINVOICE_TRANSITIONS.CANCELLED).toHaveLength(0)
        expect(canTransitionEInvoice("GIB_ACCEPTED", "CANCELLED")).toBe(false)
        expect(canTransitionEInvoice("CANCELLED", "DRAFT")).toBe(false)
    })

    it("rejects nonsensical transitions", () => {
        expect(canTransitionEInvoice("GIB_ACCEPTED", "SENDING")).toBe(false)
        expect(canTransitionEInvoice("CANCELLED", "SENDING")).toBe(false)
        expect(canTransitionEInvoice("DRAFT", "GIB_ACCEPTED")).toBe(false)
    })

    it("assertEInvoiceTransition throws ConflictError on invalid transitions", () => {
        expect(() => assertEInvoiceTransition("DRAFT", "SENDING")).not.toThrow()
        expect(() => assertEInvoiceTransition("CANCELLED", "SENDING")).toThrow(ConflictError)
    })
})
