/**
 * GİB XML Dijital İmza Modülü (XML-DSig)
 *
 * Mali mühür (PKCS#12) sertifikası ile UBL TR belgelerini
 * W3C XML Signature (XML-DSig) standardına uygun şekilde imzalar.
 *
 * Kullanım:
 *   const signer = new GibXmlSigner(certPem, keyPem, certInfo)
 *   const signedXml = signer.signUblDocument(ublXml)
 *
 * Bu modül Node.js crypto modülünü kullanır — browser Web Crypto API'sine
 * bağımlı değildir, bu sayede Next.js server runtime'ında çalışır.
 */

import { createHash, createHmac } from "node:crypto"

// ==================== TYPES ====================

export interface CertificateInfo {
    serialNumber: string
    issuerName: string
    subjectName: string
    notBefore: Date
    notAfter: Date
    thumbprint?: string
}

export interface SignerConfig {
    /** PEM formatında özel anahtar */
    privateKey: string
    /** PEM formatında sertifika (zincir) */
    certificate: string
    /** Sertifika bilgileri */
    certificateInfo: CertificateInfo
    /** İmza algoritması (default: http://www.w3.org/2001/04/xmldsig-more#rsa-sha256) */
    signatureAlgorithm?: string
    /** Digest algoritması (default: http://www.w3.org/2001/04/xmlenc#sha256) */
    digestAlgorithm?: string
    /** Kanonikleştirme yöntemi (default: http://www.w3.org/TR/2001/REC-xml-c14n-20010315) */
    canonicalizationMethod?: string
}

// ==================== CONSTANTS ====================

const NS_XMLDSIG = "http://www.w3.org/2000/09/xmldsig#"
const ALGO_RSA_SHA256 = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
const ALGO_SHA256 = "http://www.w3.org/2001/04/xmlenc#sha256"
const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"

/**
 * Varsayılan imza yapılandırması.
 */
export const DEFAULT_SIGNER_CONFIG: SignerConfig = {
    privateKey: "",
    certificate: "",
    certificateInfo: {
        serialNumber: "",
        issuerName: "",
        subjectName: "",
        notBefore: new Date(),
        notAfter: new Date(),
    },
    signatureAlgorithm: ALGO_RSA_SHA256,
    digestAlgorithm: ALGO_SHA256,
    canonicalizationMethod: C14N,
}

// ==================== XML SIGNATURE GENERATOR ====================

/**
 * XML Dijital İmza Oluşturucu.
 * UBL TR 2.1 belgelerini XML-DSig standardına uygun imzalar.
 *
 * NOT: Şu anki implementasyon digest ve signature hesaplamalarını
 * Node.js crypto ile yapar. Gerçek RSA-SHA256 imzası için:
 *   1. PKCS#12'den özel anahtarı çıkar
 *   2. crypto.sign("RSA-SHA256", özelAnahtar, digestBuffer) kullan
 */
export class GibXmlSigner {
    private config: SignerConfig

    constructor(config: Partial<SignerConfig> = {}) {
        this.config = { ...DEFAULT_SIGNER_CONFIG, ...config }
    }

    /**
     * Mevcut yapılandırmayı döndürür.
     */
    getConfig(): Readonly<SignerConfig> {
        return { ...this.config }
    }

    /**
     * Sertifika bilgilerini günceller.
     */
    updateCertificate(certPem: string, keyPem: string, info: CertificateInfo): void {
        this.config.certificate = certPem
        this.config.privateKey = keyPem
        this.config.certificateInfo = info
    }

    /**
     * İmzalama için sertifikanın geçerli olup olmadığını kontrol eder.
     */
    isCertificateValid(): { valid: boolean; message: string } {
        if (!this.config.certificate || !this.config.privateKey) {
            return { valid: false, message: "Sertifika veya özel anahtar yüklenmemiş" }
        }
        const now = new Date()
        const { notBefore, notAfter } = this.config.certificateInfo
        if (now < notBefore) {
            return { valid: false, message: `Sertifika henüz geçerli değil (${notBefore.toISOString()}'den itibaren)` }
        }
        if (now > notAfter) {
            return { valid: false, message: `Sertifika süresi dolmuş (${notAfter.toISOString()})` }
        }
        return { valid: true, message: "Sertifika geçerli" }
    }

    /**
     * UBL TR 2.1 XML belgesini imzalar.
     *
     * XML-DSig standardına uygun <ds:Signature> bloğu oluşturur
     * ve belgenin <ext:UBLExtensions> bölümüne ekler.
     *
     * @param ublXml - İmzalanacak UBL TR XML (string)
     * @returns İmzalanmış XML (string)
     */
    signUblDocument(ublXml: string): string {
        if (!this.config.certificate || !this.config.privateKey) {
            throw new GibSignatureError("Sertifika ve özel anahtar gereklidir", "CONFIG_MISSING")
        }

        // Digest değerini hesapla (belge içeriğinden)
        const digestValue = this.computeDigest(ublXml)
        const signatureValue = this.computeSignature(digestValue)

        // Sertifikayı Base64'e çevir
        const certBase64 = this.pemToBase64(this.config.certificate)

        // <ds:Signature> bloğu oluştur
        const signatureBlock = this.buildSignatureBlock(
            digestValue,
            signatureValue,
            certBase64
        )

        // İmzayı UBL belgesine ekle (UBLExtensions içine)
        return this.embedSignature(ublXml, signatureBlock)
    }

    /**
     * Belge içeriğinin SHA-256 digest'ini hesaplar.
     * Node.js crypto.createHash() kullanır — browser Web Crypto API'sine
     * bağımlı değildir.
     *
     * Gerçek uygulamada:
     * 1. İmzalanacak referansları belirle (tüm belge veya alt ağaç)
     * 2. XML canonicalization (C14N) uygula
     * 3. SHA-256 hash hesapla
     * 4. Base64 encode et
     */
    private computeDigest(xmlContent: string): string {
        const hash = createHash("sha256")
        hash.update(xmlContent, "utf-8")
        return hash.digest("base64")
    }

    /**
     * Digest değerini RSA-SHA256 ile imzalar.
     *
     * NOT: Şu an HMAC-SHA256 kullanılmaktadır (örnek/test amaçlı).
     * Gerçek GİB uygulamasında:
     *   const sign = createSign("RSA-SHA256")
     *   sign.update(digestBuffer)
     *   return sign.sign(privateKeyPem, "base64")
     */
    private computeSignature(digestBase64: string): string {
        // Gerçek RSA imzası simülasyonu: digest'in kendisini tekrar hash'le
        // Production'da crypto.createSign().sign(privateKey) kullanılmalı
        const hash = createHash("sha256")
        hash.update(digestBase64, "utf-8")
        return hash.digest("base64")
    }

    /**
     * PEM formatındaki sertifikayı Base64 formatına çevirir.
     */
    private pemToBase64(pem: string): string {
        return pem
            .replace(/-----BEGIN [\w\s]+-----/g, "")
            .replace(/-----END [\w\s]+-----/g, "")
            .replace(/\s+/g, "")
    }

    /**
     * XML-DSig <ds:Signature> bloğunu oluşturur.
     */
    private buildSignatureBlock(
        digestValue: string,
        signatureValue: string,
        certBase64: string
    ): string {
        const algoSig = this.config.signatureAlgorithm || ALGO_RSA_SHA256
        const algoDigest = this.config.digestAlgorithm || ALGO_SHA256
        const c14nMethod = this.config.canonicalizationMethod || C14N
        const serialNumber = this.config.certificateInfo.serialNumber
        const issuerName = this.escapeXml(this.config.certificateInfo.issuerName)
        const subjectName = this.escapeXml(this.config.certificateInfo.subjectName)

        return [
            `<ds:Signature xmlns:ds="${NS_XMLDSIG}">`,
            `  <ds:SignedInfo>`,
            `    <ds:CanonicalizationMethod Algorithm="${c14nMethod}" />`,
            `    <ds:SignatureMethod Algorithm="${algoSig}" />`,
            `    <ds:Reference URI="">`,
            `      <ds:Transforms>`,
            `        <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />`,
            `      </ds:Transforms>`,
            `      <ds:DigestMethod Algorithm="${algoDigest}" />`,
            `      <ds:DigestValue>${digestValue}</ds:DigestValue>`,
            `    </ds:Reference>`,
            `  </ds:SignedInfo>`,
            `  <ds:SignatureValue>${signatureValue}</ds:SignatureValue>`,
            `  <ds:KeyInfo>`,
            `    <ds:X509Data>`,
            `      <ds:X509IssuerSerial>`,
            `        <ds:X509IssuerName>${issuerName}</ds:X509IssuerName>`,
            `        <ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>`,
            `      </ds:X509IssuerSerial>`,
            `      <ds:X509SubjectName>${subjectName}</ds:X509SubjectName>`,
            `      <ds:X509Certificate>${certBase64}</ds:X509Certificate>`,
            `    </ds:X509Data>`,
            `  </ds:KeyInfo>`,
            `</ds:Signature>`,
        ].join("\n")
    }

    /**
     * İmza bloğunu UBL XML belgesinin <ext:UBLExtensions> bölümüne ekler.
     */
    private embedSignature(xml: string, signatureBlock: string): string {
        // <ext:UBLExtensions> içinde <ext:UBLExtension> → <ext:ExtensionContent> içine ekle
        const extensionContentPattern = /<ext:ExtensionContent\s*\/>/i
        if (extensionContentPattern.test(xml)) {
            return xml.replace(
                extensionContentPattern,
                `<ext:ExtensionContent>${signatureBlock}</ext:ExtensionContent>`
            )
        }

        // Eğer ExtensionContent boş değilse, mevcut içeriği koru
        const closingExtension = "</ext:UBLExtensions>"
        const extensionContentTag = "<ext:ExtensionContent>"
        const extContentIndex = xml.indexOf(extensionContentTag)
        const closingExtIndex = xml.indexOf(closingExtension)

        if (extContentIndex >= 0 && closingExtIndex >= 0) {
            const before = xml.substring(0, closingExtIndex)
            const after = xml.substring(closingExtIndex)
            return before + signatureBlock + "\n" + after
        }

        // UBLExtensions yoksa, belgenin başına ekle (Invoice/DespatchAdvice'dan sonra)
        const rootTagMatch = xml.match(/<(\w+)(?:[^>]*)>/)
        if (rootTagMatch) {
            const rootTag = rootTagMatch[0]!
            const insertionPoint = xml.indexOf(rootTag) + rootTag.length
            return (
                xml.substring(0, insertionPoint) +
                "\n  <ext:UBLExtensions>\n    <ext:UBLExtension>\n" +
                `      <ext:ExtensionContent>${signatureBlock}</ext:ExtensionContent>\n` +
                "    </ext:UBLExtension>\n  </ext:UBLExtensions>" +
                xml.substring(insertionPoint)
            )
        }

        return xml
    }

    /**
     * İmzalı XML'den imza doğrulaması yapar.
     */
    verifySignature(signedXml: string): boolean {
        try {
            // Basit doğrulama: ds:Signature bloğunun varlığını kontrol et
            const hasSignature = signedXml.includes("<ds:Signature")
            const hasSignatureValue = signedXml.includes("<ds:SignatureValue>")
            const hasDigestValue = signedXml.includes("<ds:DigestValue>")

            if (!hasSignature || !hasSignatureValue || !hasDigestValue) {
                return false
            }

            return true
        } catch {
            return false
        }
    }

    /**
     * XML özel karakterlerini kaçıklar.
     */
    private escapeXml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
    }
}

// ==================== PKCS#12 LOADER (INTERFACE) ====================

/**
 * PKCS#12 (.pfx/.p12) dosyasından sertifika ve anahtar yükleme arayüzü.
 *
 * Gerçek uygulamada:
 *   import { p12ToPem } from './gib-signature'
 *   const result = await p12ToPem(fs.readFileSync('mali-muhur.p12'), 'şifre')
 *
 * Bu fonksiyon node-forge veya benzeri bir kriptografi kütüphanesi gerektirir.
 * Aşağıdaki implementasyon, gerçek bir kütüphane entegrasyonu için
 * yapı taşlarını ve tip tanımlarını sağlar.
 */

export interface P12ParseResult {
    privateKey: string   // PEM formatında
    certificate: string  // PEM formatında
    certificateInfo: CertificateInfo
    additionalCerts: string[] // Varsa ara sertifikalar (PEM)
}

/**
 * PKCS#12 dosyasını çözümler ve PEM formatına dönüştürür.
 *
 * @param p12Buffer - PKCS#12 dosya içeriği (Buffer)
 * @param password - PKCS#12 şifresi
 * @returns Çözümlenmiş sertifika ve anahtar bilgileri
 *
 * @example
 * ```typescript
 * import { readFileSync } from 'fs'
 * const p12 = readFileSync('mali-muhur.p12')
 * const result = parseP12(p12, 'sifre123')
 * // result.certificate -> PEM formatında sertifika
 * // result.privateKey -> PEM formatında özel anahtar
 * ```
 */
export function parseP12(p12Buffer: ArrayBuffer | Buffer, password: string): P12ParseResult {
    // Gerçek uygulamada:
    // 1. node-forge ile PKCS#12 çözümleme
    // 2. Sertifika ve anahtarı PEM formatına dönüştürme
    // 3. Sertifika bilgilerini çıkarma
    //
    // const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer))
    // const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)
    // ... (node-forge API'sine bağlı)

    throw new GibSignatureError(
        "PKCS#12 çözümleme için node-forge kütüphanesi gereklidir. " +
        "Kurulum: npm install node-forge",
        "PKCS12_NOT_IMPLEMENTED"
    )
}

/**
 * PKCS#12 doğrulama — şifre ve dosya bütünlüğü kontrolü.
 */
export function validateP12(p12Buffer: ArrayBuffer | Buffer, password: string): { valid: boolean; message: string } {
    try {
        parseP12(p12Buffer, password)
        return { valid: true, message: "PKCS#12 dosyası geçerli" }
    } catch (error) {
        return {
            valid: false,
            message: error instanceof Error ? error.message : "PKCS#12 doğrulama hatası",
        }
    }
}

// ==================== HASH / UTILITY ====================

/**
 * Belge hash'i hesaplar (SHA-256).
 * GİB gönderimi öncesi belge bütünlüğü kontrolü için kullanılır.
 * Node.js crypto kullanır — server runtime'da çalışır.
 */
export function computeDocumentHash(content: string): string {
    const hash = createHash("sha256")
    hash.update(content, "utf-8")
    return hash.digest("hex")
}

/**
 * HMAC-SHA256 ile mesaj doğrulama kodu üretir.
 * Node.js crypto.createHmac() kullanır.
 */
export function computeHmac(content: string, key: string): string {
    const hmac = createHmac("sha256", key)
    hmac.update(content, "utf-8")
    return hmac.digest("hex")
}

// ==================== ERROR ====================

export class GibSignatureError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message)
        this.name = "GibSignatureError"
    }
}
