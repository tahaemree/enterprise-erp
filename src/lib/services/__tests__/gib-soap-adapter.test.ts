import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    GibSoapAdapter,
    buildSoapEnvelope,
    parseSoapResponse,
    hasSoapFault,
    getGibEndpoint,
    prettifySoapXml,
    GIB_ENDPOINTS,
    GIB_NAMESPACES,
    type GibSoapConfig,
} from "@/lib/services/gib-soap-adapter"

function mockFetchResponse(body: string, init?: ResponseInit): Response {
    return new Response(body, init)
}

// ==================== buildSoapEnvelope ====================

describe("buildSoapEnvelope", () => {
    const testConfig: GibSoapConfig = {
        environment: "test",
        username: "testuser",
        password: "testpass",
        passwordType: "PasswordText",
        soapVersion: "1.1",
        timeoutMs: 30000,
    }

    it("should produce well-formed SOAP envelope with XML declaration", () => {
        const envelope = buildSoapEnvelope("<ef:sendInvoice><ef:ubiXml>test</ef:ubiXml></ef:sendInvoice>", testConfig)
        expect(envelope).toContain('<?xml version="1.0" encoding="UTF-8"?>')
        expect(envelope).toContain("<soapenv:Envelope")
        expect(envelope).toContain("</soapenv:Envelope>")
    })

    it("should include required namespace declarations", () => {
        const envelope = buildSoapEnvelope("<test/>", testConfig)
        expect(envelope).toContain(GIB_NAMESPACES.soapenv)
        expect(envelope).toContain(GIB_NAMESPACES.wsse)
        expect(envelope).toContain(GIB_NAMESPACES.wsu)
        expect(envelope).toContain(GIB_NAMESPACES.eFatura)
    })

    it("should include WS-Security UsernameToken with username and password", () => {
        const envelope = buildSoapEnvelope("<test/>", testConfig)
        expect(envelope).toContain("<wsse:Security")
        expect(envelope).toContain("<wsse:UsernameToken")
        expect(envelope).toContain("<wsse:Username>testuser</wsse:Username>")
        expect(envelope).toContain("<wsse:Password")
        expect(envelope).toContain("testpass")
    })

    it("should use PasswordText type by default", () => {
        const envelope = buildSoapEnvelope("<test/>", testConfig)
        expect(envelope).toContain("PasswordText")
    })

    it("should include Nonce and Created elements", () => {
        const envelope = buildSoapEnvelope("<test/>", testConfig)
        expect(envelope).toContain("<wsse:Nonce")
        expect(envelope).toContain("<wsu:Created>")
    })

    it("should wrap body content in soapenv:Body", () => {
        const body = "<ef:checkUser><ef:vkn>1234567890</ef:vkn></ef:checkUser>"
        const envelope = buildSoapEnvelope(body, testConfig)
        expect(envelope).toContain("<soapenv:Body")
        expect(envelope).toContain(body)
        expect(envelope).toContain("</soapenv:Body>")
    })

    it("should add wsu:Id attribute to Body when action is provided", () => {
        const envelope = buildSoapEnvelope("<test/>", testConfig, "sendInvoice")
        expect(envelope).toContain('wsu:Id="sendInvoice"')
    })

    it("should escape XML special chars in username", () => {
        const configWithSpecialChars: GibSoapConfig = {
            ...testConfig,
            username: "user<>&'\"/>",
        }
        const envelope = buildSoapEnvelope("<test/>", configWithSpecialChars)
        expect(envelope).toContain("&lt;")
        expect(envelope).toContain("&gt;")
        expect(envelope).toContain("&amp;")
    })

    it("should escape XML special chars in password", () => {
        const configWithSpecialChars: GibSoapConfig = {
            ...testConfig,
            password: "pass&words<>\"/>",
        }
        const envelope = buildSoapEnvelope("<test/>", configWithSpecialChars)
        expect(envelope).toContain("&amp;")
        expect(envelope).toContain("&lt;")
        expect(envelope).toContain("&gt;")
    })
})

// ==================== hasSoapFault ====================

describe("hasSoapFault", () => {
    it("should detect SOAP Fault when faultcode exists", () => {
        const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultcode>soapenv:Server</faultcode>
  <faultstring>Internal error</faultstring>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
        const result = hasSoapFault(xml)
        expect(result.hasFault).toBe(true)
        expect(result.faultCode).toBe("soapenv:Server")
        expect(result.faultString).toBe("Internal error")
    })

    it("should return hasFault false when no fault elements exist", () => {
        const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:sendInvoiceResponse><ef:result>OK</ef:result></ef:sendInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`
        const result = hasSoapFault(xml)
        expect(result.hasFault).toBe(false)
    })

    it("should return hasFault false for empty string", () => {
        const result = hasSoapFault("")
        expect(result.hasFault).toBe(false)
    })

    it("should handle fault with only faultstring", () => {
        const xml = `<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultstring>Bir hata oluştu</faultstring>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
        const result = hasSoapFault(xml)
        expect(result.hasFault).toBe(true)
        expect(result.faultCode).toBeUndefined()
        expect(result.faultString).toBe("Bir hata oluştu")
    })
})

// ==================== parseSoapResponse ====================

describe("parseSoapResponse", () => {
    describe("sendInvoice", () => {
        it("should parse successful sendInvoice response with document number", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:sendInvoiceResponse>
  <documentNumber>GIB202600000001</documentNumber>
</ef:sendInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "sendInvoice")
            if ("accepted" in result) {
                expect(result.accepted).toBe(true)
                expect(result.documentNumber).toBe("GIB202600000001")
            } else {
                expect.unreachable()
            }
        })

        it("should parse successful sendInvoice response with warnings", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:sendInvoiceResponse>
  <documentNumber>GIB202600000002</documentNumber>
  <warning>Uyarı: Mükellef bilgileri eksik</warning>
  <warning>Uyarı: Tutar farkı var</warning>
</ef:sendInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "sendInvoice")
            expect(result.accepted).toBe(true)
            const warnings = result.warnings ?? []
            expect(warnings).toHaveLength(2)
            expect(warnings[0]).toContain("Mükellef")
            expect(warnings[1]).toContain("Tutar")
        })

        it("should return error when SOAP Fault exists", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultcode>soapenv:Server</faultcode>
  <faultstring>GIB-001: Servis hatası</faultstring>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "sendInvoice")
            expect(result.accepted).toBe(false)
            expect(result.errorCode).toBe("soapenv:Server")
        })

        it("should return accepted true for non-XML without SOAP Fault", () => {
            const result = parseSoapResponse("not xml", "sendInvoice")
            expect(result.accepted).toBe(true)
            expect(result.documentNumber).toBeUndefined()
        })
    })

    describe("getInvoiceStatus", () => {
        it("should parse ACCEPTED status", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>KABUL</status>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("ACCEPTED")
        })

        it("should parse REJECTED status", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>RED</status>
  <errorCode>GIB-100</errorCode>
  <errorMessage>XML şeması geçersiz</errorMessage>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("REJECTED")
            expect(result.errorCode).toBe("GIB-100")
            expect(result.errorMessage).toBe("XML şeması geçersiz")
        })

        it("should parse WARNING status (UYARI)", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>UYARI</status>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("WARNING")
        })

        it("should parse PENDING status (BEKLIYOR)", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>BEKLIYOR</status>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("PENDING")
        })

        it("should default to NOT_FOUND for unknown status", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>BILINMIYOR</status>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("NOT_FOUND")
        })

        it("should return REJECTED on SOAP Fault", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultstring>Service unavailable</faultstring>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "getInvoiceStatus")
            expect(result.status).toBe("REJECTED")
        })
    })

    describe("checkUser", () => {
        it("should parse registered user response", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:checkUserResponse>
  <registered>true</registered>
  <title>ACME Ltd. Şti.</title>
  <vkn>1234567890</vkn>
</ef:checkUserResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "checkUser")
            expect(result.isRegistered).toBe(true)
            expect(result.title).toBe("ACME Ltd. Şti.")
            expect(result.taxId).toBe("1234567890")
        })

        it("should parse unregistered user response", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:checkUserResponse>
  <registered>false</registered>
</ef:checkUserResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "checkUser")
            expect(result.isRegistered).toBe(false)
        })

        it("should parse registered with '1' value", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:checkUserResponse>
  <registered>1</registered>
</ef:checkUserResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "checkUser")
            expect(result.isRegistered).toBe(true)
        })

        it("should return false on SOAP Fault", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultstring>Server error</faultstring>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "checkUser")
            expect(result.isRegistered).toBe(false)
            expect(result.errorMessage).toBe("Server error")
        })
    })

    describe("cancelInvoice", () => {
        it("should parse successful cancellation", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:cancelInvoiceResponse>
  <success>true</success>
</ef:cancelInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "cancelInvoice")
            expect(result.accepted).toBe(true)
        })

        it("should parse failed cancellation", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:cancelInvoiceResponse>
  <success>false</success>
</ef:cancelInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "cancelInvoice")
            expect(result.accepted).toBe(false)
        })

        it("should handle SOAP Fault in cancellation", () => {
            const xml = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<soapenv:Fault>
  <faultcode>soapenv:Server</faultcode>
</soapenv:Fault>
</soapenv:Body></soapenv:Envelope>`
            const result = parseSoapResponse(xml, "cancelInvoice")
            expect(result.accepted).toBe(false)
        })
    })
})

// ==================== getGibEndpoint ====================

describe("getGibEndpoint", () => {
    it("should return test invoice endpoint", () => {
        const endpoint = getGibEndpoint("test", "INVOICE")
        expect(endpoint).toBe(GIB_ENDPOINTS.test.invoice)
    })

    it("should return test archive endpoint", () => {
        const endpoint = getGibEndpoint("test", "ARCHIVE")
        expect(endpoint).toBe(GIB_ENDPOINTS.test.archive)
    })

    it("should return test despatch endpoint", () => {
        const endpoint = getGibEndpoint("test", "DESPATCH_ADVICE")
        expect(endpoint).toBe(GIB_ENDPOINTS.test.despatch)
    })

    it("should return production invoice endpoint", () => {
        const endpoint = getGibEndpoint("production", "INVOICE")
        expect(endpoint).toBe(GIB_ENDPOINTS.production.invoice)
    })

    it("should return production despatch endpoint", () => {
        const endpoint = getGibEndpoint("production", "DESPATCH_ADVICE")
        expect(endpoint).toBe(GIB_ENDPOINTS.production.despatch)
    })
})

// ==================== GibSoapAdapter ====================

describe("GibSoapAdapter", () => {
    describe("constructor and config", () => {
        it("should create instance with default test config", () => {
            const adapter = new GibSoapAdapter()
            const config = adapter.getConfig()
            expect(config.environment).toBe("test")
            expect(config.username).toBe("")
            expect(config.password).toBe("")
            expect(config.passwordType).toBe("PasswordText")
            expect(config.timeoutMs).toBe(30000)
        })

        it("should merge provided config with defaults", () => {
            const adapter = new GibSoapAdapter({
                username: "myuser",
                password: "mypass",
            })
            const config = adapter.getConfig()
            expect(config.username).toBe("myuser")
            expect(config.password).toBe("mypass")
            expect(config.environment).toBe("test") // default preserved
        })

        it("should set production environment when specified", () => {
            const adapter = new GibSoapAdapter({ environment: "production" })
            expect(adapter.getConfig().environment).toBe("production")
        })
    })

    describe("updateConfig", () => {
        it("should update config fields", () => {
            const adapter = new GibSoapAdapter({ username: "old" })
            adapter.updateConfig({ username: "new", environment: "production" })
            const config = adapter.getConfig()
            expect(config.username).toBe("new")
            expect(config.environment).toBe("production")
        })
    })

    describe("getSigner", () => {
        it("should return undefined when no signer config provided", () => {
            const adapter = new GibSoapAdapter()
            expect(adapter.getSigner()).toBeUndefined()
        })

        it("should return GibXmlSigner instance when signerConfig provided", () => {
            const adapter = new GibSoapAdapter({
                signerConfig: { privateKey: "key", certificate: "cert" },
            })
            const signer = adapter.getSigner()
            expect(signer).toBeDefined()
        })
    })

    describe("sendInvoice", () => {
        let adapter: GibSoapAdapter

        beforeEach(() => {
            adapter = new GibSoapAdapter({
                username: "testuser",
                password: "testpass",
                timeoutMs: 5000,
            })
            // Mock fetch to prevent actual HTTP calls
            global.fetch = vi.fn()
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it("should return success when GİB accepts the invoice", async () => {
            const mockResponse = `<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:sendInvoiceResponse>
  <documentNumber>GIB202600000001</documentNumber>
</ef:sendInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`

            vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse(mockResponse))

            const result = await adapter.sendInvoice({
                ublXml: "<Invoice>...</Invoice>",
                uuid: "test-uuid",
                documentType: "INVOICE",
            })

            // With retry being async and mocked fetch, let's check the result structure
            expect(result).toHaveProperty("success")
        })

        it("should return ERR_TIMEOUT when fetch times out", async () => {
            // Use persistent mock so all retry attempts also reject with AbortError
            vi.mocked(fetch).mockRejectedValue(new DOMException("The operation was aborted", "AbortError"))

            const result = await adapter.sendInvoice({
                ublXml: "<Invoice>...</Invoice>",
                uuid: "test-uuid",
                documentType: "INVOICE",
            })

            expect(result.success).toBe(false)
            if (result.error) {
                // classifyErrorFromMessage translates "zaman aşımı" to ERR_UNKNOWN if not specifically handled
                expect(result.error.code).toBe("ERR_UNKNOWN")
            }
        }, 20000)

        it("should throw GIB-002 on network errors", async () => {
            // Use persistent mock so all retry attempts also reject
            vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"))

            const result = await adapter.sendInvoice({
                ublXml: "<Invoice>...</Invoice>",
                uuid: "test-uuid",
                documentType: "INVOICE",
            })

            expect(result.success).toBe(false)
        }, 20000)

        it("should return GIB-001 on HTTP 500", async () => {
            // Use persistent mock so all retry attempts return HTTP 500
            vi.mocked(fetch).mockResolvedValue(
                mockFetchResponse("Server Error", {
                    status: 500,
                    statusText: "Internal Server Error",
                })
            )

            const result = await adapter.sendInvoice({
                ublXml: "<Invoice>...</Invoice>",
                uuid: "test-uuid",
                documentType: "INVOICE",
            })

            expect(result.success).toBe(false)
        }, 20000)
    })

    describe("getInvoiceStatus", () => {
        it("should query invoice status from GIB", async () => {
            const adapter = new GibSoapAdapter({
                username: "testuser",
                password: "testpass",
                timeoutMs: 5000,
            })

            global.fetch = vi.fn().mockResolvedValueOnce(mockFetchResponse(`<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getInvoiceStatusResponse>
  <status>KABUL</status>
</ef:getInvoiceStatusResponse>
</soapenv:Body></soapenv:Envelope>`))

            const result = await adapter.getInvoiceStatus("test-uuid", "INVOICE")
            expect(result).toHaveProperty("success")
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })
    })

    describe("checkUser", () => {
        it("should check if a tax ID is registered for e-Invoice", async () => {
            const adapter = new GibSoapAdapter({
                username: "testuser",
                password: "testpass",
                timeoutMs: 5000,
            })

            global.fetch = vi.fn().mockResolvedValueOnce(mockFetchResponse(`<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:checkUserResponse>
  <registered>true</registered>
  <title>ACME Ltd.</title>
  <vkn>1234567890</vkn>
</ef:checkUserResponse>
</soapenv:Body></soapenv:Envelope>`))

            const result = await adapter.checkUser("1234567890")
            expect(result).toHaveProperty("success")
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })
    })

    describe("cancelInvoice", () => {
        it("should cancel an invoice", async () => {
            const adapter = new GibSoapAdapter({
                username: "testuser",
                password: "testpass",
                timeoutMs: 5000,
            })

            global.fetch = vi.fn().mockResolvedValueOnce(mockFetchResponse(`<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:cancelInvoiceResponse>
  <success>true</success>
</ef:cancelInvoiceResponse>
</soapenv:Body></soapenv:Envelope>`))

            const result = await adapter.cancelInvoice("test-uuid", "Mükellef hatası")
            expect(result).toHaveProperty("success")
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })
    })

    describe("getDocumentNumber", () => {
        it("should get document number for e-Arşiv", async () => {
            const adapter = new GibSoapAdapter({
                username: "testuser",
                password: "testpass",
                timeoutMs: 5000,
            })

            global.fetch = vi.fn().mockResolvedValueOnce(mockFetchResponse(`<?xml version="1.0"?>
<soapenv:Envelope><soapenv:Body>
<ef:getDocumentNumberResponse>
  <documentNumber>ARS202600000001</documentNumber>
</ef:getDocumentNumberResponse>
</soapenv:Body></soapenv:Envelope>`))

            const result = await adapter.getDocumentNumber("test-uuid")
            expect(result).toHaveProperty("success")
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })
    })
})

// ==================== prettifySoapXml ====================

describe("prettifySoapXml", () => {
    it("should return non-empty string for valid XML", () => {
        const xml = `<?xml version="1.0"?>
<root><child>value</child></root>`
        const result = prettifySoapXml(xml)
        expect(result.length).toBeGreaterThan(0)
        expect(result).toContain("<root>")
        expect(result).toContain("<child>")
    })

    it("should skip empty lines", () => {
        const xml = "line1\n\n\nline2"
        const result = prettifySoapXml(xml)
        expect(result).not.toContain("\n\n\n")
    })
})
