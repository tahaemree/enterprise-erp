"use server"

import { XMLParser } from "fast-xml-parser"
import { prisma } from "@/lib/prisma"
import { createLogger } from "@/lib/logger"

const logger = createLogger("tcmb")

export async function fetchTcmbRates() {
    try {
        logger.info("Fetching TCMB rates...")
        const response = await fetch("http://www.tcmb.gov.tr/kurlar/today.xml", { next: { revalidate: 3600 } })
        const xmlData = await response.text()
        
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        })
        const result = parser.parse(xmlData)
        
        const currencies = result.Tarih_Date.Currency
        
        // Let's get all tenants
        const tenants = await prisma.tenant.findMany()

        let updatedCount = 0

        for (const tenant of tenants) {
            // Find TRY currency (Base) for this tenant
            let tryCurrency = await prisma.currency.findFirst({ where: { code: "TRY", tenantId: tenant.id } })
            
            if (!tryCurrency) {
                tryCurrency = await prisma.currency.create({
                    data: {
                        code: "TRY",
                        name: "TÜRK LİRASI",
                        symbol: "₺",
                        isDefault: true,
                        tenantId: tenant.id
                    }
                })
            }

            for (const currency of currencies) {
                const code = currency["@_CurrencyCode"]
                const buyingRate = parseFloat(currency.ForexBuying)

                if (!code || isNaN(buyingRate)) continue

                // Find or create currency in DB for this tenant
                let dbCurrency = await prisma.currency.findFirst({ where: { code, tenantId: tenant.id } })
                
                if (!dbCurrency) {
                    dbCurrency = await prisma.currency.create({
                        data: {
                            code,
                            name: currency.Isim,
                            symbol: code,
                            tenantId: tenant.id
                        }
                    })
                }

                // Insert new exchange rate for this tenant
                await prisma.currencyExchangeRate.create({
                    data: {
                        rate: buyingRate,
                        source: "TCMB",
                        tenantId: tenant.id,
                        fromCurrencyId: dbCurrency.id,
                        toCurrencyId: tryCurrency.id,
                    }
                })
                updatedCount++
            }
        }
        
        return { success: true, message: `Successfully updated ${updatedCount} rates.` }

    } catch (error) {
        logger.error("TCMB fetch error:", { error: error instanceof Error ? { message: error.message, name: error.name } : String(error) })
        return { success: false, error: String(error) }
    }
}
