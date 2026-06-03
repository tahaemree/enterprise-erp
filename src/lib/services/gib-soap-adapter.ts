/**
 * GİB SOAP/XML Web Servis Adaptörü
 *
 * Gelir İdaresi Başkanlığı (GİB) e-Belge web servislerine
 * SOAP/XML üzerinden erişim sağlar.
 *
 * Desteklenen servisler:
 * - e-Fatura (sendInvoice, getInvoiceStatus, checkUser, cancelInvoice)
 * - e-Arşiv (farklı endpoint, benzer operasyonlar)
 * - e-İrsaliye (farklı endpoint, benzer operasyonlar)
 *
 * WS-Security: UsernameToken ile kimlik doğrulama
 * İmzalama: GibXmlSigner ile XML-DSig
 * Hata Yönetimi: retry-engine ile entegre
 */

import { submitWithRetry, type RetryResult } from "./retry-engine"
import { GibXmlSigner, type SignerConfig } from "./gib-signature"

// ==================== TYPES ====================

export type GibEnvironment = "test" | "production"

export interface GibSoapConfig {
    /** Ortam: test veya production */
    environment: GibEnvironment
    /** GİB kullanıcı adı (entegrasyon hesabı) */
    username: string
    /** GİB şifre */
    password: string
    /** WS-Security password type (default: PasswordText) */
    passwordType: "PasswordText" | "PasswordDigest"
    /** SOAP versiyonu (default: 1.1) */
    soapVersion: "1.1" | "1.2"
    /** İstek zaman aşımı (ms, default: 30000) */
    timeoutMs: number
    /** İmza yapılandırması (opsiyonel) */
    signerConfig?: Partial<SignerConfig>
}

export type GibDocumentType = "INVOICE" | "ARCHIVE" | "DESPATCH_ADVICE"

export interface GibSendInvoiceRequest {
    /** UBL TR 2.1 XML içeriği */
    ublXml: string
    /** Belge UUID'si */
    uuid: string
    /** Belge türü */
    documentType: GibDocumentType
}

export interface GibSendInvoiceResponse {
    /** GİB işlem durumu */
    accepted: boolean
    /** GİB tarafından atanan belge numarası */
    documentNumber?: string
    /** Varsa uyarı mesajları */
    warnings?: string[]
    /** Varsa hata kodu */
    errorCode?: string
    /** Hata mesajı */
    errorMessage?: string
    /** GİB yanıtı (ham SOAP XML) */
    rawResponse?: string
}

export interface GibStatusResponse {
    /** GİB belge durumu */
    status: "ACCEPTED" | "REJECTED" | "WARNING" | "PENDING" | "NOT_FOUND"
    /** Varsa hata kodu */
    errorCode?: string
    /** Hata mesajı */
    errorMessage?: string
    /** GİB yanıtı (ham SOAP XML) */
    rawResponse?: string
}

export interface GibCheckUserResponse {
    /** Kullanıcı e-Fatura mükellefi mi? */
    isRegistered: boolean
    /** Kullanıcının vergi kimlik bilgisi */
    taxId?: string
    /** Kullanıcı ünvanı */
    title?: string
    /** Varsa hata */
    errorMessage?: string
}

// ==================== DEFAULT CONFIG ====================

/**
 * Varsayılan GİB SOAP yapılandırması.
 * Test ortamı için ön tanımlı endpoint'ler.
 */
export const DEFAULT_GIB_CONFIG: GibSoapConfig = {
    environment: "test",
    username: "",
    password: "",
    passwordType: "PasswordText",
    soapVersion: "1.1",
    timeoutMs: 30000,
}

/**
 * GİB web servis endpoint'leri.
 *
 * Not: GİB'in endpoint URL'leri zaman zaman değişebilir.
 * Güncel URL'ler için ebelge.gib.gov.tr adresini kontrol edin.
 * Gerçek uygulamada bu URL'ler tenant/entegratör bazında
 * yapılandırılabilir olmalıdır.
 */
export const GIB_ENDPOINTS = {
    test: {
        invoice: "https://test.efatura.gov.tr/EFaturaWebService",
        archive: "https://test.earsiv.efatura.gov.tr/EarsivWebService",
        despatch: "https://test.efatura.gov.tr/EDespatchWebService",
    },
    production: {
        invoice: "https://efatura.gib.gov.tr/EFaturaWebService",
        archive: "https://earsiv.efatura.gib.gov.tr/EarsivWebService",
        despatch: "https://efatura.gib.gov.tr/EDespatchWebService",
    },
} as const

/**
 * GİB XML namespace'leri.
 */
export const GIB_NAMESPACES = {
    soapenv: "http://schemas.xmlsoap.org/soap/envelope/",
    wsse: "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd",
    wsu: "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd",
    eFatura: "http://www.efatura.gov.tr/",
} as const

// ==================== SOAP ENVELOPE BUILDER ====================

/**
 * SOAP zarfı oluşturucu.
 * WS-Security UsernameToken ile kimlik doğrulama başlığı ekler.
 */
export function buildSoapEnvelope(
    bodyContent: string,
    config: GibSoapConfig,
    action?: string
): string {
    const timestamp = new Date().toISOString().replace(/[:\-]/g, "").substring(0, 15) + "Z"
    const created = new Date().toISOString()
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 dk geçerlilik

    const passwordToken = config.passwordType === "PasswordDigest"
        ? buildPasswordDigest(config.password, timestamp)
        : escapeXml(config.password)

    return [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<soapenv:Envelope xmlns:soapenv="${GIB_NAMESPACES.soapenv}"` +
        ` xmlns:wsse="${GIB_NAMESPACES.wsse}"` +
        ` xmlns:wsu="${GIB_NAMESPACES.wsu}"` +
        ` xmlns:ef="${GIB_NAMESPACES.eFatura}">`,
        `  <soapenv:Header>`,
        `    <wsse:Security soapenv:mustUnderstand="1">`,
        `      <wsu:Timestamp wsu:Id="Timestamp-1">`,
        `        <wsu:Created>${created}</wsu:Created>`,
        `        <wsu:Expires>${expires}</wsu:Expires>`,
        `      </wsu:Timestamp>`,
        `      <wsse:UsernameToken wsu:Id="UsernameToken-1">`,
        `        <wsse:Username>${escapeXml(config.username)}</wsse:Username>`,
        `        <wsse:Password Type="${config.passwordType === "PasswordDigest" ? "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest" : "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText"}">${passwordToken}</wsse:Password>`,
        `        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${generateNonce()}</wsse:Nonce>`,
        `        <wsu:Created>${created}</wsu:Created>`,
        `      </wsse:UsernameToken>`,
        `    </wsse:Security>`,
        `  </soapenv:Header>`,
        `  <soapenv:Body>` +
        (action ? ` wsu:Id="${escapeXml(action)}"` : "") +
        `>`,
        `      ${bodyContent}`,
        `  </soapenv:Body>`,
        `</soapenv:Envelope>`,
    ].join("\n")
}

/**
 * PasswordDigest hesaplama: Base64(SHA-1(Nonce + Created + Password))
 * GİB WS-Security PasswordDigest formatı.
 */
function buildPasswordDigest(password: string, timestamp: string): string {
    // Gerçek uygulamada:
    // const nonce = generateNonce()
    // const hash = crypto.createHash('sha1').update(nonce + timestamp + password).digest()
    // return Buffer.from(hash).toString('base64')
    // 
    // Şimdilik simüle ediyoruz
    const nonce = generateNonce()
    const raw = nonce + timestamp + password
    // Not: crypto.subtle.digest SHA-1 destekliyor
    // Şu an basit Base64 dönüşümü yapıyoruz
    return btoa(raw)
}

/**
 * Rastgele Nonce değeri üretir (Base64).
 */
function generateNonce(): string {
    const bytes = new Uint8Array(20)
    crypto.getRandomValues(bytes)
    return btoa(String.fromCharCode(...bytes))
}

// ==================== GİB OPERASYON SOAP BODY'LERİ ====================

/**
 * sendInvoice SOAP body'si oluşturur.
 * UBL TR XML'i GİB'e gönderir.
 */
function buildSendInvoiceBody(ublXml: string, uuid: string): string {
    return [
        `<ef:sendInvoice>`,
        `  <ef:ublXml>`,
        `    <![CDATA[${ublXml}]]>`,
        `  </ef:ublXml>`,
        `  <ef:uuid>${escapeXml(uuid)}</ef:uuid>`,
        `</ef:sendInvoice>`,
    ].join("\n")
}

/**
 * getInvoiceStatus SOAP body'si oluşturur.
 * Belgenin GİB'deki durumunu sorgular.
 */
function buildGetStatusBody(uuid: string): string {
    return [
        `<ef:getInvoiceStatus>`,
        `  <ef:uuid>${escapeXml(uuid)}</ef:uuid>`,
        `</ef:getInvoiceStatus>`,
    ].join("\n")
}

/**
 * checkUser SOAP body'si oluşturur.
 * Bir VKN/TCKN'nin e-Fatura mükellefi olup olmadığını kontrol eder.
 */
function buildCheckUserBody(taxId: string): string {
    return [
        `<ef:checkUser>`,
        `  <ef:vkn>${escapeXml(taxId)}</ef:vkn>`,
        `</ef:checkUser>`,
    ].join("\n")
}

/**
 * cancelInvoice SOAP body'si oluşturur.
 * GİB'e gönderilmiş bir faturayı iptal eder.
 */
function buildCancelInvoiceBody(uuid: string, reason: string): string {
    return [
        `<ef:cancelInvoice>`,
        `  <ef:uuid>${escapeXml(uuid)}</ef:uuid>`,
        `  <ef:cancellationReason>${escapeXml(reason)}</ef:cancellationReason>`,
        `</ef:cancelInvoice>`,
    ].join("\n")
}

/**
 * getDocumentNumber SOAP body'si oluşturur.
 * e-Arşiv fatura numarası almak için.
 */
function buildGetDocumentNumberBody(uuid: string): string {
    return [
        `<ef:getDocumentNumber>`,
        `  <ef:uuid>${escapeXml(uuid)}</ef:uuid>`,
        `</ef:getDocumentNumber>`,
    ].join("\n")
}

// ==================== GİB SOAP YANIT AYRIŞTIRICI ====================

/**
 * SOAP yanıtını ayrıştırır ve structured formata dönüştürür.
 * 
 * @param soapResponse - GİB'den gelen ham SOAP XML yanıtı
 * @param operation - Çağrılan operasyon adı
 * @returns Ayrıştırılmış yanıt
 */
export function parseSoapResponse(
    soapResponse: string,
    operation: "sendInvoice" | "cancelInvoice"
): GibSendInvoiceResponse
export function parseSoapResponse(
    soapResponse: string,
    operation: "getInvoiceStatus"
): GibStatusResponse
export function parseSoapResponse(
    soapResponse: string,
    operation: "checkUser"
): GibCheckUserResponse
export function parseSoapResponse(
    soapResponse: string,
    operation: "sendInvoice" | "getInvoiceStatus" | "checkUser" | "cancelInvoice"
): GibSendInvoiceResponse | GibStatusResponse | GibCheckUserResponse {
    try {
        switch (operation) {
            case "sendInvoice":
                return parseSendInvoiceResponse(soapResponse)
            case "getInvoiceStatus":
                return parseGetStatusResponse(soapResponse)
            case "checkUser":
                return parseCheckUserResponse(soapResponse)
            case "cancelInvoice":
                return parseCancelInvoiceResponse(soapResponse)
        }
    } catch (error) {
        return {
            status: "REJECTED",
            errorCode: "PARSE_ERROR",
            errorMessage: `SOAP yanıtı ayrıştırılamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`,
            rawResponse: soapResponse,
        } as GibStatusResponse
    }
}

/**
 * SOAP hata (Fault) varlığını kontrol eder.
 */
export function hasSoapFault(soapResponse: string): { hasFault: boolean; faultCode?: string; faultString?: string } {
    const faultCodeMatch = soapResponse.match(/<faultcode[^>]*>([^<]+)<\/faultcode>/i)
    const faultStringMatch = soapResponse.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i)

    if (faultCodeMatch || faultStringMatch) {
        return {
            hasFault: true,
            faultCode: faultCodeMatch?.[1],
            faultString: faultStringMatch?.[1],
        }
    }

    return { hasFault: false }
}

/**
 * sendInvoice yanıtını ayrıştırır.
 */
function parseSendInvoiceResponse(xml: string): GibSendInvoiceResponse {
    const fault = hasSoapFault(xml)
    if (fault.hasFault) {
        return {
            accepted: false,
            errorCode: fault.faultCode || "SOAP_FAULT",
            errorMessage: fault.faultString || "SOAP hatası",
            rawResponse: xml,
        }
    }

    // Yanıttan belge numarasını çıkar
    const docNumMatch = xml.match(/<documentNumber[^>]*>([^<]+)<\/documentNumber>/i)
    // Varsa uyarı mesajlarını çıkar
    const warnings: string[] = []
    const warningRegex = /<warning[^>]*>([^<]+)<\/warning>/gi
    let match
    while ((match = warningRegex.exec(xml)) !== null) {
        warnings.push(match[1]!)
    }

    return {
        accepted: !fault.hasFault,
        documentNumber: docNumMatch?.[1],
        warnings: warnings.length > 0 ? warnings : undefined,
        rawResponse: xml,
    }
}

/**
 * getInvoiceStatus yanıtını ayrıştırır.
 */
function parseGetStatusResponse(xml: string): GibStatusResponse {
    const fault = hasSoapFault(xml)
    if (fault.hasFault) {
        return {
            status: "REJECTED",
            errorCode: fault.faultCode || "SOAP_FAULT",
            errorMessage: fault.faultString || "SOAP hatası",
            rawResponse: xml,
        }
    }

    const statusMatch = xml.match(/<status[^>]*>([^<]+)<\/status>/i)
    const errorCodeMatch = xml.match(/<errorCode[^>]*>([^<]+)<\/errorCode>/i)
    const errorMessageMatch = xml.match(/<errorMessage[^>]*>([^<]+)<\/errorMessage>/i)

    const status = statusMatch?.[1]?.toUpperCase()
    const mappedStatus: GibStatusResponse["status"] = status === "KABUL" || status === "ACCEPTED"
        ? "ACCEPTED"
        : status === "RED" || status === "REJECTED"
            ? "REJECTED"
            : status === "UYARI" || status === "WARNING"
                ? "WARNING"
                : status === "BEKLIYOR" || status === "PENDING"
                    ? "PENDING"
                    : "NOT_FOUND"

    return {
        status: mappedStatus,
        errorCode: errorCodeMatch?.[1],
        errorMessage: errorMessageMatch?.[1],
        rawResponse: xml,
    }
}

/**
 * checkUser yanıtını ayrıştırır.
 */
function parseCheckUserResponse(xml: string): GibCheckUserResponse {
    const fault = hasSoapFault(xml)
    if (fault.hasFault) {
        return { isRegistered: false, errorMessage: fault.faultString || "SOAP hatası" }
    }

    const registeredMatch = xml.match(/<registered[^>]*>([^<]+)<\/registered>/i)
    const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/i)
    const taxIdMatch = xml.match(/<vkn[^>]*>([^<]+)<\/vkn>/i) || xml.match(/<tckn[^>]*>([^<]+)<\/tckn>/i)

    return {
        isRegistered: registeredMatch?.[1]?.toLowerCase() === "true" || registeredMatch?.[1] === "1",
        taxId: taxIdMatch?.[1],
        title: titleMatch?.[1],
    }
}

/**
 * cancelInvoice yanıtını ayrıştırır.
 */
function parseCancelInvoiceResponse(xml: string): GibSendInvoiceResponse {
    const fault = hasSoapFault(xml)
    if (fault.hasFault) {
        return {
            accepted: false,
            errorCode: fault.faultCode || "SOAP_FAULT",
            errorMessage: fault.faultString || "SOAP hatası",
            rawResponse: xml,
        }
    }

    const successMatch = xml.match(/<success[^>]*>([^<]+)<\/success>/i)
    return {
        accepted: successMatch?.[1]?.toLowerCase() === "true" || successMatch?.[1] === "1",
        rawResponse: xml,
    }
}

// ==================== ENDPOINT SEÇİCİ ====================

/**
 * Belge türüne ve ortama göre GİB endpoint URL'sini döndürür.
 */
export function getGibEndpoint(environment: GibEnvironment, documentType: GibDocumentType): string {
    const env = GIB_ENDPOINTS[environment]
    switch (documentType) {
        case "INVOICE":
            return env.invoice
        case "ARCHIVE":
            return env.archive
        case "DESPATCH_ADVICE":
            return env.despatch
    }
}

// ==================== GİB SOAP ADAPTER CLASS ====================

/**
 * GİB SOAP Web Servis Adaptörü.
 * 
 * Tüm GİB e-Belge işlemleri için tek giriş noktası.
 * Retry mekanizması ile hata toleranslı gönderim yapar.
 * 
 * Kullanım:
 *   const adapter = new GibSoapAdapter({
 *     environment: "test",
 *     username: "kullanici",
 *     password: "sifre",
 *   })
 *   const result = await adapter.sendInvoice({ ublXml, uuid, documentType: "INVOICE" })
 */
export class GibSoapAdapter {
    private config: GibSoapConfig
    private signer?: GibXmlSigner

    constructor(config: Partial<GibSoapConfig> = {}) {
        this.config = { ...DEFAULT_GIB_CONFIG, ...config }
        if (this.config.signerConfig) {
            this.signer = new GibXmlSigner(this.config.signerConfig)
        }
    }

    /**
     * Mevcut yapılandırmayı döndürür.
     */
    getConfig(): Readonly<GibSoapConfig> {
        return { ...this.config }
    }

    /**
     * Yapılandırmayı günceller.
     */
    updateConfig(config: Partial<GibSoapConfig>): void {
        this.config = { ...this.config, ...config }
        if (config.signerConfig) {
            this.signer = new GibXmlSigner(config.signerConfig)
        }
    }

    /**
     * İmza modülünü döndürür (varsa).
     */
    getSigner(): GibXmlSigner | undefined {
        return this.signer
    }

    // ==================== OPERASYONLAR ====================

    /**
     * e-Fatura / e-Arşiv / e-İrsaliye'yi GİB'e gönderir.
     * Retry mekanizması ile hata toleranslı gönderim yapar.
     * 
     * @param request - Gönderim verileri (UBL XML, UUID, belge türü)
     * @returns Retry sonucu + GİB yanıtı
     */
    async sendInvoice(
        request: GibSendInvoiceRequest
    ): Promise<RetryResult<GibSendInvoiceResponse>> {
        return submitWithRetry(
            async () => {
                // 1. UBL XML'i imzala (signer varsa)
                let signedXml = request.ublXml
                if (this.signer) {
                    const certValid = this.signer.isCertificateValid()
                    if (!certValid.valid) {
                        throw new Error(`GIB-003: ${certValid.message}`)
                    }
                    signedXml = await this.signer.signUblDocument(request.ublXml)
                }

                // 2. SOAP zarfı oluştur
                const soapBody = buildSendInvoiceBody(signedXml, request.uuid)
                const soapEnvelope = buildSoapEnvelope(soapBody, this.config, "sendInvoice")

                // 3. Endpoint belirle
                const endpoint = getGibEndpoint(this.config.environment, request.documentType)

                // 4. HTTP çağrısı yap
                const response = await this.executeSoapCall(endpoint, soapEnvelope)

                // 5. Yanıtı ayrıştır
                const parsed = parseSoapResponse(response, "sendInvoice") as GibSendInvoiceResponse

                if (!parsed.accepted) {
                    throw new Error(
                        parsed.errorCode
                            ? `${parsed.errorCode}: ${parsed.errorMessage || "GİB gönderim hatası"}`
                            : "GIB-001: GİB servisi geçici olarak kullanılamıyor"
                    )
                }

                return parsed
            },
            {
                maxRetries: 3,
                baseDelayMs: 2000,
                backoffMultiplier: 2,
                maxDelayMs: 30000,
                retryableCategories: ["NETWORK", "TIMEOUT", "SERVER"],
            }
        )
    }

    /**
     * GİB'deki belge durumunu sorgular.
     * 
     * @param uuid - Belge UUID'si
     * @param documentType - Belge türü (endpoint seçimi için)
     * @returns Retry sonucu + durum bilgisi
     */
    async getInvoiceStatus(
        uuid: string,
        documentType: GibDocumentType = "INVOICE"
    ): Promise<RetryResult<GibStatusResponse>> {
        return submitWithRetry(
            async () => {
                const soapBody = buildGetStatusBody(uuid)
                const soapEnvelope = buildSoapEnvelope(soapBody, this.config, "getInvoiceStatus")
                const endpoint = getGibEndpoint(this.config.environment, documentType)
                const response = await this.executeSoapCall(endpoint, soapEnvelope)
                const parsed = parseSoapResponse(response, "getInvoiceStatus") as GibStatusResponse

                if (parsed.status === "REJECTED" && parsed.errorCode) {
                    throw new Error(`${parsed.errorCode}: ${parsed.errorMessage || "Durum sorgulama hatası"}`)
                }

                return parsed
            },
            { maxRetries: 2, baseDelayMs: 1000 }
        )
    }

    /**
     * Bir VKN/TCKN'nin e-Fatura mükellefi olup olmadığını kontrol eder.
     * 
     * @param taxId - Vergi kimlik numarası (VKN veya TCKN)
     * @returns Retry sonucu + kullanıcı bilgisi
     */
    async checkUser(taxId: string): Promise<RetryResult<GibCheckUserResponse>> {
        return submitWithRetry(
            async () => {
                const soapBody = buildCheckUserBody(taxId)
                const soapEnvelope = buildSoapEnvelope(soapBody, this.config, "checkUser")
                const endpoint = getGibEndpoint(this.config.environment, "INVOICE")
                const response = await this.executeSoapCall(endpoint, soapEnvelope)
                const parsed = parseSoapResponse(response, "checkUser") as GibCheckUserResponse
                return parsed
            },
            { maxRetries: 2, baseDelayMs: 1000 }
        )
    }

    /**
     * GİB'e gönderilmiş bir belgeyi iptal eder.
     * 
     * @param uuid - İptal edilecek belgenin UUID'si
     * @param reason - İptal gerekçesi
     * @param documentType - Belge türü
     * @returns Retry sonucu
     */
    async cancelInvoice(
        uuid: string,
        reason: string,
        documentType: GibDocumentType = "INVOICE"
    ): Promise<RetryResult<GibSendInvoiceResponse>> {
        return submitWithRetry(
            async () => {
                const soapBody = buildCancelInvoiceBody(uuid, reason)
                const soapEnvelope = buildSoapEnvelope(soapBody, this.config, "cancelInvoice")
                const endpoint = getGibEndpoint(this.config.environment, documentType)
                const response = await this.executeSoapCall(endpoint, soapEnvelope)
                const parsed = parseSoapResponse(response, "cancelInvoice") as GibSendInvoiceResponse

                if (!parsed.accepted) {
                    throw new Error(
                        parsed.errorCode
                            ? `${parsed.errorCode}: ${parsed.errorMessage || "İptal başarısız"}`
                            : "GIB-001: İptal işlemi başarısız"
                    )
                }

                return parsed
            },
            { maxRetries: 2, baseDelayMs: 2000 }
        )
    }

    /**
     * e-Arşiv için belge numarası alır.
     * 
     * @param uuid - Belge UUID'si
     * @returns Retry sonucu + belge numarası
     */
    async getDocumentNumber(uuid: string): Promise<RetryResult<{ documentNumber: string }>> {
        return submitWithRetry(
            async () => {
                const soapBody = buildGetDocumentNumberBody(uuid)
                const soapEnvelope = buildSoapEnvelope(soapBody, this.config, "getDocumentNumber")
                const endpoint = getGibEndpoint(this.config.environment, "ARCHIVE")
                const response = await this.executeSoapCall(endpoint, soapEnvelope)

                const docNumMatch = response.match(/<documentNumber[^>]*>([^<]+)<\/documentNumber>/i)
                if (!docNumMatch) {
                    throw new Error("GIB-100: Belge numarası alınamadı")
                }

                return { documentNumber: docNumMatch[1]! }
            },
            { maxRetries: 3, baseDelayMs: 1000 }
        )
    }

    // ==================== HTTP TAŞIYICI ====================

    /**
     * SOAP isteğini HTTP üzerinden GİB servisine iletir.
     * 
     * Gerçek uygulamada fetch() API'sini kullanır.
     * Şu an için XMLHttpRequest benzeri bir mekanizma simüle edilmiştir.
     * 
     * @param endpoint - GİB servis URL'si
     * @param soapEnvelope - SOAP XML zarfı
     * @returns GİB yanıtı (ham XML string)
     */
    private async executeSoapCall(endpoint: string, soapEnvelope: string): Promise<string> {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": `text/xml; charset=utf-8${this.config.soapVersion === "1.2" ? "; action=\"\"" : ""}`,
                    "SOAPAction": "",
                    "Accept": "text/xml",
                },
                body: soapEnvelope,
                signal: controller.signal,
            })

            const responseText = await response.text()

            if (!response.ok) {
                // HTTP hata kodlarını GİB hata formatına çevir
                const errorCode = response.status >= 500 ? "GIB-001" : "GIB-100"
                throw new Error(`${errorCode}: HTTP ${response.status} — ${response.statusText}`)
            }

            return responseText
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new Error("GIB-200: İstek zaman aşımına uğradı")
                }
                if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED") || error.message.includes("fetch")) {
                    throw new Error("GIB-002: GİB bağlantı hatası")
                }
            }
            throw error
        } finally {
            clearTimeout(timeoutId)
        }
    }
}

// ==================== UTILITY ====================

/**
 * SOAP XML'i daha okunabilir formata dönüştürür (debug için).
 */
export function prettifySoapXml(xml: string): string {
    const lines = xml.split("\n")
    const result: string[] = []
    let indent = 0

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // Kapanış etiketi ise girinti azalt
        if (trimmed.startsWith("</") || trimmed.startsWith("/>")) {
            indent--
        }

        result.push("  ".repeat(Math.max(0, indent)) + trimmed)

        // Açılış etiketi ise girinti artır
        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>") && !trimmed.startsWith("<![CDATA[")) {
            // Self-closing kontrolü
            if (!trimmed.endsWith("/>") && !trimmed.includes("</")) {
                // Tek satırda hem açılış hem kapanış mı?
                const openCount = (trimmed.match(/<[^/]/g) || []).length
                const closeCount = (trimmed.match(/<\/[^>]+>/g) || []).length
                if (openCount <= closeCount) {
                    continue
                }
                indent++
            }
        }
    }

    return result.join("\n")
}

/**
 * XML özel karakterlerini kaçıklar.
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}
