import { describe, it, expect } from "vitest"
import {
    GibXmlSigner,
    computeDocumentHash,
    computeHmac,
    parseP12,
    validateP12,
    GibSignatureError,
    type CertificateInfo,
} from "@/lib/services/gib-signature"

// ==================== TEST FIXTURES ====================

const sampleCertInfo: CertificateInfo = {
    serialNumber: "1234567890ABCDEF",
    issuerName: "CN=GIB Test CA, O=Gelir Idaresi Baskanligi, C=TR",
    subjectName: "CN=Test Mali Muhur, OU=Test, O=Test Sirket, C=TR",
    notBefore: new Date("2025-01-01"),
    notAfter: new Date("2027-12-31"),
}

const samplePemCert = `-----BEGIN CERTIFICATE-----
MIIDazCCAlMCFAjxR3Y7Zq5vM9KJkJkZmU5L8jZEMA0GCSqGSIb3DQEBCwUAMF
-----END CERTIFICATE-----`

const samplePemKey = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8c
-----END PRIVATE KEY-----`

const sampleUblXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent/>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>TICARIFATURA</cbc:ProfileID>
  <cbc:ID>INV202600001</cbc:ID>
  <cbc:UUID>123e4567-e89b-12d3-a456-426614174000</cbc:UUID>
  <cbc:IssueDate>2026-01-15</cbc:IssueDate>
</Invoice>`

// ==================== GibXmlSigner — CONSTRUCTOR & CONFIG ====================

describe("GibXmlSigner", () => {
    describe("constructor and config", () => {
        it("should create instance with default config when no args given", () => {
            const signer = new GibXmlSigner()
            const config = signer.getConfig()
            expect(config.signatureAlgorithm).toBe("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
            expect(config.digestAlgorithm).toBe("http://www.w3.org/2001/04/xmlenc#sha256")
            expect(config.canonicalizationMethod).toBe("http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            expect(config.privateKey).toBe("")
            expect(config.certificate).toBe("")
        })

        it("should merge partial config with defaults", () => {
            const signer = new GibXmlSigner({
                privateKey: samplePemKey,
                certificate: samplePemCert,
            })
            const config = signer.getConfig()
            expect(config.privateKey).toBe(samplePemKey)
            expect(config.certificate).toBe(samplePemCert)
            // Defaults preserved
            expect(config.signatureAlgorithm).toBe("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
        })

        it("should override defaults when provided", () => {
            const customAlgo = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512"
            const signer = new GibXmlSigner({ signatureAlgorithm: customAlgo })
            expect(signer.getConfig().signatureAlgorithm).toBe(customAlgo)
        })
    })

    // ==================== CERTIFICATE MANAGEMENT ====================

    describe("updateCertificate", () => {
        it("should update certificate, key, and info", () => {
            const signer = new GibXmlSigner()
            const newInfo: CertificateInfo = {
                serialNumber: "NEWSERIAL",
                issuerName: "CN=New CA",
                subjectName: "CN=New Cert",
                notBefore: new Date("2026-01-01"),
                notAfter: new Date("2028-01-01"),
            }
            signer.updateCertificate("new-cert", "new-key", newInfo)
            const config = signer.getConfig()
            expect(config.certificate).toBe("new-cert")
            expect(config.privateKey).toBe("new-key")
            expect(config.certificateInfo.serialNumber).toBe("NEWSERIAL")
        })
    })

    // ==================== isCertificateValid ====================

    describe("isCertificateValid", () => {
        it("should return invalid when certificate is empty", () => {
            const signer = new GibXmlSigner()
            const result = signer.isCertificateValid()
            expect(result.valid).toBe(false)
            expect(result.message).toContain("Sertifika")
        })

        it("should return invalid when private key is empty", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: "",
            })
            const result = signer.isCertificateValid()
            expect(result.valid).toBe(false)
        })

        it("should return valid when certificate is within valid date range", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
            })
            const result = signer.isCertificateValid()
            expect(result.valid).toBe(true)
            expect(result.message).toContain("geçerli")
        })

        it("should return invalid when certificate is not yet valid", () => {
            const futureInfo: CertificateInfo = {
                ...sampleCertInfo,
                notBefore: new Date("2099-01-01"),
                notAfter: new Date("2100-12-31"),
            }
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: futureInfo,
            })
            const result = signer.isCertificateValid()
            expect(result.valid).toBe(false)
            expect(result.message).toContain("henüz")
        })

        it("should return invalid when certificate has expired", () => {
            const expiredInfo: CertificateInfo = {
                ...sampleCertInfo,
                notBefore: new Date("2020-01-01"),
                notAfter: new Date("2021-12-31"),
            }
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: expiredInfo,
            })
            const result = signer.isCertificateValid()
            expect(result.valid).toBe(false)
            expect(result.message).toContain("süresi dolmuş")
        })
    })

    // ==================== signUblDocument ====================

    describe("signUblDocument", () => {
        it("should throw GibSignatureError when no certificate configured", () => {
            const signer = new GibXmlSigner()
            expect(() => signer.signUblDocument(sampleUblXml)).toThrow(GibSignatureError)
        })

        it("should throw GibSignatureError with CONFIG_MISSING code", () => {
            const signer = new GibXmlSigner()
            expect(() => signer.signUblDocument(sampleUblXml)).toThrow(GibSignatureError)
            try {
                signer.signUblDocument(sampleUblXml)
            } catch (error) {
                expect(error).toBeInstanceOf(GibSignatureError)
                if (error instanceof GibSignatureError) {
                    expect(error.code).toBe("CONFIG_MISSING")
                }
            }
        })

        it("should produce signed XML when certificate and key are configured", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            expect(signedXml).toContain("<ds:Signature")
            expect(signedXml).toContain("<ds:SignatureValue>")
            expect(signedXml).toContain("<ds:DigestValue>")
            expect(signedXml).toContain("<ds:KeyInfo>")
            expect(signedXml).toContain("<ds:X509Certificate>")
        })

        it("should embed signature inside ext:UBLExtensions", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            // Signature should be inside ExtensionContent
            expect(signedXml).toContain("<ext:ExtensionContent>")
            expect(signedXml).toContain("</ext:UBLExtensions>")
            // Signature should appear before UBLExtensions closing
            const extContentIndex = signedXml.indexOf("<ext:ExtensionContent>")
            const closingExtIndex = signedXml.indexOf("</ext:UBLExtensions>")
            expect(extContentIndex).toBeGreaterThan(0)
            expect(closingExtIndex).toBeGreaterThan(extContentIndex)
        })

        it("should include certificate details in X509Data", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            expect(signedXml).toContain("<ds:X509IssuerName>CN=GIB Test CA, O=Gelir Idaresi Baskanligi, C=TR</ds:X509IssuerName>")
            expect(signedXml).toContain("<ds:X509SerialNumber>1234567890ABCDEF</ds:X509SerialNumber>")
            expect(signedXml).toContain("<ds:X509SubjectName>CN=Test Mali Muhur, OU=Test, O=Test Sirket, C=TR</ds:X509SubjectName>")
        })

        it("should use configured signature algorithm in XML", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
                signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha512",
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            expect(signedXml).toContain("SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha512\"")
        })
    })

    // ==================== verifySignature ====================

    describe("verifySignature", () => {
        it("should return true for XML that contains valid signature elements", () => {
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: sampleCertInfo,
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            const result = signer.verifySignature(signedXml)
            expect(result).toBe(true)
        })

        it("should return false for XML without signature", () => {
            const signer = new GibXmlSigner()
            const result = signer.verifySignature(sampleUblXml)
            expect(result).toBe(false)
        })

        it("should return false for empty string", () => {
            const signer = new GibXmlSigner()
            const result = signer.verifySignature("")
            expect(result).toBe(false)
        })
    })

    // ==================== XML ESCAPING IN SIGNATURE ====================

    describe("XML escaping in signature", () => {
        it("should escape special characters in issuer name", () => {
            const infoWithSpecialChars: CertificateInfo = {
                ...sampleCertInfo,
                issuerName: 'CN=Test & "Company" <O=Test>',
            }
            const signer = new GibXmlSigner({
                certificate: samplePemCert,
                privateKey: samplePemKey,
                certificateInfo: infoWithSpecialChars,
            })
            const signedXml = signer.signUblDocument(sampleUblXml)
            expect(signedXml).toContain("&amp;")
            expect(signedXml).toContain("&quot;")
            expect(signedXml).toContain("&lt;")
        })
    })
})

// ==================== computeDocumentHash ====================

describe("computeDocumentHash", () => {
    it("should return a hex string of 64 characters (SHA-256)", () => {
        const hash = computeDocumentHash("test content")
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it("should return different hashes for different content", () => {
        const hash1 = computeDocumentHash("content A")
        const hash2 = computeDocumentHash("content B")
        expect(hash1).not.toBe(hash2)
    })

    it("should return the same hash for identical content", () => {
        const hash1 = computeDocumentHash("same content")
        const hash2 = computeDocumentHash("same content")
        expect(hash1).toBe(hash2)
    })

    it("should handle empty string", () => {
        const hash = computeDocumentHash("")
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
})

// ==================== computeHmac ====================

describe("computeHmac", () => {
    it("should return a hex string", () => {
        const hmac = computeHmac("message", "key")
        expect(hmac).toMatch(/^[0-9a-f]+$/)
        expect(hmac.length).toBeGreaterThan(0)
    })

    it("should return different values for different keys", () => {
        const hmac1 = computeHmac("message", "key1")
        const hmac2 = computeHmac("message", "key2")
        expect(hmac1).not.toBe(hmac2)
    })

    it("should return different values for different messages", () => {
        const hmac1 = computeHmac("msg1", "key")
        const hmac2 = computeHmac("msg2", "key")
        expect(hmac1).not.toBe(hmac2)
    })
})

// ==================== parseP12 / validateP12 ====================

describe("parseP12", () => {
    it("should throw GibSignatureError with PKCS12_NOT_IMPLEMENTED code", () => {
        const buffer = new ArrayBuffer(10)
        expect(() => parseP12(buffer, "password")).toThrow(GibSignatureError)
        try {
            parseP12(buffer, "password")
        } catch (error) {
            expect(error).toBeInstanceOf(GibSignatureError)
            if (error instanceof GibSignatureError) {
                expect(error.code).toBe("PKCS12_NOT_IMPLEMENTED")
                expect(error.message).toContain("node-forge")
            }
        }
    })
})

describe("validateP12", () => {
    it("should return valid: false with error message when parseP12 throws", () => {
        const buffer = new ArrayBuffer(10)
        const result = validateP12(buffer, "password")
        expect(result.valid).toBe(false)
        expect(result.message).toContain("node-forge")
    })
})

// ==================== GibSignatureError ====================

describe("GibSignatureError", () => {
    it("should have name GibSignatureError", () => {
        const error = new GibSignatureError("test error", "TEST_CODE")
        expect(error.name).toBe("GibSignatureError")
    })

    it("should store the code", () => {
        const error = new GibSignatureError("test", "TEST_CODE")
        expect(error.code).toBe("TEST_CODE")
    })

    it("should store the message", () => {
        const error = new GibSignatureError("test message", "TEST")
        expect(error.message).toBe("test message")
    })
})
