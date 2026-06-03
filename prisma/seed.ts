import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { encrypt } from "@/lib/encryption"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Deftra — Tohumlama başlıyor...")
    console.log("═══════════════════════════════════════════\n")

    // ─── Clean existing data (order matters for FK constraints) ──────────
    await prisma.accountEntryLine.deleteMany()
    await prisma.accountEntry.deleteMany()
    await prisma.customerAccount.deleteMany()
    await prisma.supplierAccount.deleteMany()
    await prisma.baBsFormItem.deleteMany()
    await prisma.baBsForm.deleteMany()
    await prisma.eInvoice.deleteMany()
    await prisma.checkPromissoryNote.deleteMany()
    await prisma.currencyExchangeRate.deleteMany()
    await prisma.currency.deleteMany()
    await prisma.inflationCoefficient.deleteMany()
    await prisma.taxType.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.leaveRequest.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.department.deleteMany()
    await prisma.product.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.category.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.interaction.deleteMany()
    await prisma.costCenter.deleteMany()
    await prisma.bankAccount.deleteMany()
    await prisma.activityLog.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.tenant.deleteMany()
    console.log("✅ Eski veriler temizlendi\n")

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10)
    const hash = (pw: string) => bcrypt.hash(pw, saltRounds)

    // ====================================================================
    //  TENANT 1 — Deftra Teknoloji A.Ş. (PROFESSIONAL plan)
    //  Gerçekçi bir Türk teknoloji şirketi
    // ====================================================================
    const tenant1 = await prisma.tenant.create({
        data: {
            name: "Deftra Teknoloji A.Ş.",
            slug: "nexus-teknoloji",
            plan: "PROFESSIONAL",
            isActive: true,
            taxId: process.env.TENANT_TAX_ID || "1234567890",
            taxOffice: process.env.TENANT_TAX_OFFICE || "Maslak VD",
        },
    })
    console.log(`✅ Tenant oluşturuldu: ${tenant1.name} (${tenant1.plan})`)

    // ── Kullanıcılar ──────────────────────────────────────────────────────
    const adminPassword = process.env.ADMIN_PASSWORD || "password123"
    const managerPassword = process.env.MANAGER_PASSWORD || "password123"
    const userPassword = process.env.USER_PASSWORD || "password123"

    console.log("\n🔐 SECURITY NOTICE - INITIAL PASSWORDS:")
    if (!process.env.ADMIN_PASSWORD) console.log(`Admin: ${adminPassword}`)
    if (!process.env.MANAGER_PASSWORD) console.log(`Manager: ${managerPassword}`)
    if (!process.env.USER_PASSWORD) console.log(`Viewer: ${userPassword}`)
    console.log("--------------------------------------------------\n")

    const [pwAdmin, pwManager, pwUser] = await Promise.all([
        hash(adminPassword),
        hash(managerPassword),
        hash(userPassword),
    ])

    const adminUser = await prisma.user.create({
        data: { email: "admin@deftra.com", name: "Ahmet Yıldırım (Admin)", password: pwAdmin, role: "ADMIN", tenantId: tenant1.id },
    })
    const managerUser = await prisma.user.create({
        data: { email: "manager@deftra.com", name: "Ayşe Kaya (Manager)", password: pwManager, role: "MANAGER", tenantId: tenant1.id },
    })
    await prisma.user.create({
        data: { email: "viewer@deftra.com", name: "Mehmet Demir (Viewer)", password: pwUser, role: "VIEWER", tenantId: tenant1.id },
    })

    // ====================================================================
    //  PARAMETRE TABLOLARI — Türk Muhasebe Modülü
    // ====================================================================

    // ── Para Birimleri (Currencies) ──────────────────────────────────────
    const currencyTRY = await prisma.currency.create({
        data: { code: "TRY", name: "Türk Lirası", symbol: "₺", isDefault: true, tenantId: tenant1.id },
    })
    const currencyUSD = await prisma.currency.create({
        data: { code: "USD", name: "ABD Doları", symbol: "$", tenantId: tenant1.id },
    })
    const currencyEUR = await prisma.currency.create({
        data: { code: "EUR", name: "Euro", symbol: "€", tenantId: tenant1.id },
    })
    const currencyGBP = await prisma.currency.create({
        data: { code: "GBP", name: "İngiliz Sterlini", symbol: "£", tenantId: tenant1.id },
    })
    console.log("✅ Para birimleri oluşturuldu: 4")

    // ── Döviz Kurları (TCMB verileri baz alınmıştır) ────────────────────
    const now = new Date()
    const dayMs = 86400000
    const ratesData = [
        // Tarih, USD/TRY, EUR/TRY, GBP/TRY
        { offset: 90, usd: 36.45, eur: 39.12, gbp: 46.28 },
        { offset: 60, usd: 36.52, eur: 39.28, gbp: 46.35 },
        { offset: 30, usd: 36.38, eur: 39.05, gbp: 46.12 },
        { offset: 0, usd: 36.55, eur: 39.35, gbp: 46.42 },
    ]
    for (const r of ratesData) {
        const d = new Date(now.getTime() - r.offset * dayMs)
        await prisma.currencyExchangeRate.create({
            data: {
                fromCurrencyId: currencyUSD.id, toCurrencyId: currencyTRY.id,
                rate: r.usd, date: d, source: "TCMB", tenantId: tenant1.id,
            },
        })
        await prisma.currencyExchangeRate.create({
            data: {
                fromCurrencyId: currencyEUR.id, toCurrencyId: currencyTRY.id,
                rate: r.eur, date: d, source: "TCMB", tenantId: tenant1.id,
            },
        })
        await prisma.currencyExchangeRate.create({
            data: {
                fromCurrencyId: currencyGBP.id, toCurrencyId: currencyTRY.id,
                rate: r.gbp, date: d, source: "TCMB", tenantId: tenant1.id,
            },
        })
    }
    console.log("✅ Döviz kurları oluşturuldu")

    // ── Vergi Türleri (KDV + Tevkifat + Stopaj) ──────────────────────────
    await prisma.taxType.createMany({
        data: [
            { code: "KDV1", name: "%1 KDV (Temel Gıda)", rate: 1, category: "VAT", tenantId: tenant1.id },
            { code: "KDV2", name: "%8 KDV (İndirimli)", rate: 8, category: "VAT", tenantId: tenant1.id },
            { code: "KDV3", name: "%18 KDV (Genel)", rate: 18, category: "VAT", tenantId: tenant1.id },
            { code: "KDV4", name: "%20 KDV (Lüks)", rate: 20, category: "VAT", tenantId: tenant1.id },
            { code: "TEVKIFAT_3_10", name: "%3/10 Tevkifat", rate: 3.0, category: "WITHHOLDING", description: "3/10 oranında KDV tevkifatı (YEM, TEM)", tenantId: tenant1.id },
            { code: "TEVKIFAT_5_10", name: "%5/10 Tevkifat", rate: 5.0, category: "WITHHOLDING", description: "5/10 oranında KDV tevkifatı (Temizlik, Bahçe)", tenantId: tenant1.id },
            { code: "TEVKIFAT_7_10", name: "%7/10 Tevkifat", rate: 7.0, category: "WITHHOLDING", description: "7/10 oranında KDV tevkifatı (Yapım İşleri)", tenantId: tenant1.id },
            { code: "TEVKIFAT_9_10", name: "%9/10 Tevkifat", rate: 9.0, category: "WITHHOLDING", description: "9/10 oranında KDV tevkifatı (Kiralama)", tenantId: tenant1.id },
            { code: "STOPAJ_10", name: "%10 Stopaj", rate: 10, category: "STOPAJ", description: "%10 Gelir Vergisi Stopajı", tenantId: tenant1.id },
            { code: "STOPAJ_15", name: "%15 Stopaj", rate: 15, category: "STOPAJ", description: "%15 Gelir Vergisi Stopajı (Kira)", tenantId: tenant1.id },
            { code: "STOPAJ_20", name: "%20 Stopaj", rate: 20, category: "STOPAJ", description: "%20 Gelir Vergisi Stopajı (Serbest Meslek)", tenantId: tenant1.id },
        ],
    })
    console.log("✅ Vergi türleri oluşturuldu: 11")

    // ── Enflasyon Düzeltme Katsayıları (Yİ-ÜFE bazlı, 2024-2025) ────────
    const inflationData: { year: number; month: number; coeff: number; ppi: number }[] = [
        { year: 2024, month: 1, coeff: 1.00000, ppi: 1978.36 },
        { year: 2024, month: 2, coeff: 1.01987, ppi: 2017.89 },
        { year: 2024, month: 3, coeff: 1.04521, ppi: 2067.54 },
        { year: 2024, month: 4, coeff: 1.07234, ppi: 2120.56 },
        { year: 2024, month: 5, coeff: 1.09876, ppi: 2174.12 },
        { year: 2024, month: 6, coeff: 1.11234, ppi: 2201.89 },
        { year: 2024, month: 7, coeff: 1.12890, ppi: 2233.45 },
        { year: 2024, month: 8, coeff: 1.14123, ppi: 2258.34 },
        { year: 2024, month: 9, coeff: 1.15345, ppi: 2282.56 },
        { year: 2024, month: 10, coeff: 1.16890, ppi: 2312.78 },
        { year: 2024, month: 11, coeff: 1.18234, ppi: 2339.56 },
        { year: 2024, month: 12, coeff: 1.19567, ppi: 2365.89 },
        { year: 2025, month: 1, coeff: 1.21234, ppi: 2398.45 },
        { year: 2025, month: 2, coeff: 1.22567, ppi: 2424.78 },
        { year: 2025, month: 3, coeff: 1.23901, ppi: 2451.23 },
    ]
    for (const inf of inflationData) {
        await prisma.inflationCoefficient.create({
            data: {
                year: inf.year, month: inf.month,
                coefficient: inf.coeff, ppi: inf.ppi,
                source: "TÜİK", tenantId: tenant1.id,
            },
        })
    }
    console.log(`✅ Enflasyon katsayıları oluşturuldu: ${inflationData.length}`)

    // ── Masraf Merkezleri (Cost Centers) ────────────────────────────────
    const ccGenel = await prisma.costCenter.create({
        data: { code: "CC-001", name: "Genel Yönetim", description: "Genel yönetim giderleri", tenantId: tenant1.id },
    })
    const ccPazarlama = await prisma.costCenter.create({
        data: { code: "CC-002", name: "Pazarlama & Satış", description: "Pazarlama ve satış faaliyetleri", tenantId: tenant1.id },
    })
    const _ccArge = await prisma.costCenter.create({
        data: { code: "CC-003", name: "Ar-Ge", description: "Araştırma ve geliştirme", tenantId: tenant1.id },
    })
    const _ccUretim = await prisma.costCenter.create({
        data: { code: "CC-004", name: "Üretim", description: "Üretim ve operasyon", tenantId: tenant1.id },
    })
    const ccIT = await prisma.costCenter.create({
        data: { code: "CC-005", name: "Bilgi Teknolojileri", description: "BT altyapı ve yazılım", tenantId: tenant1.id },
    })
    console.log("✅ Masraf merkezleri oluşturuldu: 5")

    // ── Banka Hesapları ──────────────────────────────────────────────────
    const bankZiraatTL = await prisma.bankAccount.create({
        data: {
            bankName: "T.C. Ziraat Bankası", branchName: "Levent Şubesi", branchCode: "1234",
            accountNumber: "TR12-0001-2345-6789", iban: "TR12000123456789000001",
            accountType: "CHECKING", currency: "TRY", balance: 2450000,
            description: "Ana TL hesabı", tenantId: tenant1.id,
        },
    })
    const bankIsTL = await prisma.bankAccount.create({
        data: {
            bankName: "Türkiye İş Bankası", branchName: "Kadıköy Şubesi", branchCode: "5678",
            accountNumber: "TR34-5678-9012-3456", iban: "TR34567890123456000002",
            accountType: "CHECKING", currency: "TRY", balance: 980000,
            description: "Maaş ödemeleri hesabı", tenantId: tenant1.id,
        },
    })
    const bankGarantiUSD = await prisma.bankAccount.create({
        data: {
            bankName: "Garanti BBVA", branchName: "Maslak Şubesi", branchCode: "9012",
            accountNumber: "TR56-9012-3456-7890", iban: "TR56901234567890000003",
            accountType: "CHECKING", currency: "USD", balance: 45000,
            description: "Döviz ihracat hesabı", tenantId: tenant1.id,
        },
    })
    const _bankAkbankEUR = await prisma.bankAccount.create({
        data: {
            bankName: "Akbank", branchName: "Etiler Şubesi", branchCode: "3456",
            accountNumber: "TR78-3456-7890-1234", iban: "TR78345678901234000004",
            accountType: "SAVINGS", currency: "EUR", balance: 32000,
            description: "Euro vadeli hesap", tenantId: tenant1.id,
        },
    })
    await prisma.bankAccount.create({
        data: {
            bankName: "Yapı Kredi", branchName: "Kozyatağı Şubesi", branchCode: "7890",
            accountNumber: "TR90-7890-1234-5678", iban: "TR90789012345678000005",
            accountType: "POS", currency: "TRY", balance: 125000,
            description: "POS tahsilat hesabı", tenantId: tenant1.id,
        },
    })
    await prisma.bankAccount.create({
        data: {
            bankName: "QNB Finansbank", branchName: "Ankara Şubesi", branchCode: "1111",
            accountNumber: "TR11-1111-2222-3333", iban: "TR11111122223333000006",
            accountType: "LOAN", currency: "TRY", balance: -500000,
            description: "Kredi hesabı (kefaletli ticari kredi)", tenantId: tenant1.id,
        },
    })
    console.log("✅ Banka hesapları oluşturuldu: 6")

    // ====================================================================
    //  ENVANTER MODÜLÜ
    // ====================================================================

    // ── Kategoriler ──────────────────────────────────────────────────────
    const catBilgisayar = await prisma.category.create({
        data: { name: "Bilgisayar & Donanım", slug: "bilgisayar-donanim", description: "Bilgisayar, laptop ve donanım ürünleri", color: "#3B82F6", tenantId: tenant1.id },
    })
    const catMobilya = await prisma.category.create({
        data: { name: "Ofis Mobilyaları", slug: "ofis-mobilyalari", description: "Masa, sandalye ve ofis mobilyaları", color: "#10B981", tenantId: tenant1.id },
    })
    const catSarf = await prisma.category.create({
        data: { name: "Sarf Malzemeleri", slug: "sarf-malzemeleri", description: "Kırtasiye ve ofis sarf malzemeleri", color: "#F59E0B", tenantId: tenant1.id },
    })
    const catYazilim = await prisma.category.create({
        data: { name: "Yazılım & Lisans", slug: "yazilim-lisans", description: "Yazılım lisansları ve abonelikler", color: "#8B5CF6", tenantId: tenant1.id },
    })
    const catTemizlik = await prisma.category.create({
        data: { name: "Temizlik & Hijyen", slug: "temizlik-hijyen", description: "Temizlik malzemeleri ve hijyen ürünleri", color: "#EC4899", tenantId: tenant1.id },
    })
    const catAg = await prisma.category.create({
        data: { name: "Network & İletişim", slug: "network-iletisim", description: "Ağ ekipmanları ve iletişim cihazları", color: "#14B8A6", tenantId: tenant1.id },
    })
    console.log("✅ Kategoriler oluşturuldu: 6")

    // ── Tedarikçiler (Türk firmaları) ────────────────────────────────────
    const supBilisim = await prisma.supplier.create({
        data: {
            name: "Bilişim Teknoloji A.Ş.", contactName: "Can Öztürk",
            email: "satis@bilisimtekno.com.tr", phone: "+90 212 444 0101",
            address: "Maslak Mah. Teknoloji Cad. No:5", city: "İstanbul", state: "Sarıyer",
            country: "Türkiye", postalCode: "34485", website: "www.bilisimtekno.com.tr",
            paymentTerms: "30 Gün",
            tenantId: tenant1.id,
        },
    })
    const supOfis = await prisma.supplier.create({
        data: {
            name: "Ofis Dünyası Tic. Ltd. Şti.", contactName: "Zeynep Aksoy",
            email: "info@ofisdunyasi.com", phone: "+90 216 444 0202",
            address: "Kozyatağı Mah. İş Merkezi No:12", city: "İstanbul", state: "Kadıköy",
            country: "Türkiye", postalCode: "34742", website: "www.ofisdunyasi.com",
            paymentTerms: "45 Gün",
            tenantId: tenant1.id,
        },
    })
    const supYazilim = await prisma.supplier.create({
        data: {
            name: "Yazılım Çözümleri A.Ş.", contactName: "Ali Kara",
            email: "satis@yazilimcozumleri.com", phone: "+90 312 444 0303",
            address: "Söğütözü Mah. Teknokent No:88", city: "Ankara", state: "Çankaya",
            country: "Türkiye", postalCode: "06530", website: "www.yazilimcozumleri.com",
            paymentTerms: "30 Gün",
            tenantId: tenant1.id,
        },
    })
    const supHijyen = await prisma.supplier.create({
        data: {
            name: "Hijyen Grup Temizlik San.", contactName: "Derya Yıldız",
            email: "siparis@hijyengrup.com", phone: "+90 232 444 0404",
            address: "Bornova Cad. No:45", city: "İzmir", state: "Bornova",
            country: "Türkiye", postalCode: "35040", website: "www.hijyengrup.com",
            paymentTerms: "60 Gün",
            tenantId: tenant1.id,
        },
    })
    const supNetwork = await prisma.supplier.create({
        data: {
            name: "Network Plus Bilişim", contactName: "Burak Şahin",
            email: "satis@networkplus.com.tr", phone: "+90 212 444 0505",
            address: "Şişli Merkez Cad. No:200", city: "İstanbul", state: "Şişli",
            country: "Türkiye", postalCode: "34381", website: "www.networkplus.com.tr",
            paymentTerms: "30 Gün",
            tenantId: tenant1.id,
        },
    })
    console.log("✅ Tedarikçiler oluşturuldu: 5")

    // ── Ürünler ──────────────────────────────────────────────────────────
    const prodLaptop = await prisma.product.create({
        data: {
            name: "DeftraBook Pro 15\" İş Bilgisayarı", sku: "LAPTOP-NX-001",
            barcode: "8681234567890",
            description: "Intel Core i7, 32GB RAM, 1TB SSD, Windows 11 Pro - İşletmeler için üst düzey dizüstü bilgisayar",
            price: 45999.99, costPrice: 32500, quantity: 45, minStock: 10, maxStock: 100,
            unit: "adet", categoryId: catBilgisayar.id, supplierId: supBilisim.id, tenantId: tenant1.id,
        },
    })
    const prodMonitor = await prisma.product.create({
        data: {
            name: 'Dell UltraSharp 27" 4K IPS Monitör', sku: "MON-DELL-001",
            barcode: "8681234567891",
            description: "27 inç 4K UHD IPS panel, USB-C hub, profesyonel renk doğruluğu",
            price: 18999.99, costPrice: 14500, quantity: 30, minStock: 5, maxStock: 50,
            unit: "adet", categoryId: catBilgisayar.id, supplierId: supBilisim.id, tenantId: tenant1.id,
        },
    })
    const prodDesk = await prisma.product.create({
        data: {
            name: "Executive Ofis Masası (Ceviz)", sku: "FRN-DESK-001",
            description: "Büyük boy ahşap ceviz kaplama yönetici masası, 180x80cm",
            price: 8999.99, costPrice: 5800, quantity: 15, minStock: 3, maxStock: 30,
            unit: "adet", categoryId: catMobilya.id, supplierId: supOfis.id, tenantId: tenant1.id,
        },
    })
    const prodChair = await prisma.product.create({
        data: {
            name: "Ergonomik Ofis Koltuğu (Sırt Destekli)", sku: "FRN-CHAIR-001",
            description: "Bel destekli, ayarlanabilir kolluklu, sırt filesi, premium ergonomik ofis koltuğu",
            price: 5999.99, costPrice: 3800, quantity: 85, minStock: 15, maxStock: 150,
            unit: "adet", categoryId: catMobilya.id, supplierId: supOfis.id, tenantId: tenant1.id,
        },
    })
    const _prodPaper = await prisma.product.create({
        data: {
            name: "A4 Fotokopi Kağıdı (80gr, 500 yaprak)", sku: "PAPER-A4-001",
            barcode: "8681234567892",
            description: "Birinci kalite A4 ofis kağıdı, 80 gram, 500 yapraklık paket",
            price: 149.99, costPrice: 95, quantity: 1200, minStock: 200, maxStock: 5000,
            unit: "paket", categoryId: catSarf.id, supplierId: supOfis.id, tenantId: tenant1.id,
        },
    })
    const _prodKB = await prisma.product.create({
        data: {
            name: "Kablosuz Klavye & Fare Seti (Türkçe Q)", sku: "KB-MOUSE-001",
            description: "2.4GHz kablosuz, sessiz tuşlu, ergonomik tasarım, Türkçe Q klavye",
            price: 1599.99, costPrice: 1050, quantity: 120, minStock: 20, maxStock: 200,
            unit: "set", categoryId: catBilgisayar.id, supplierId: supBilisim.id, tenantId: tenant1.id,
        },
    })
    const prodWebcam = await prisma.product.create({
        data: {
            name: "Logitech C920 HD Webcam 1080p", sku: "CAM-LOG-001",
            description: "Full HD 1080p, otomatik odaklama, stereo mikrofonlu web kamera",
            price: 2499.99, costPrice: 1800, quantity: 8, minStock: 10, maxStock: 50,
            unit: "adet", categoryId: catBilgisayar.id, supplierId: supBilisim.id, tenantId: tenant1.id,
        },
    })
    const _prodLamp = await prisma.product.create({
        data: {
            name: "LED Ofis Masası Lambası", sku: "LAMP-LED-001",
            description: "Ayarlanabilir parlaklık, 3 renk sıcaklığı, USB şarjlı LED masa lambası",
            price: 749.99, costPrice: 450, quantity: 55, minStock: 10, maxStock: 100,
            unit: "adet", categoryId: catMobilya.id, supplierId: supOfis.id, tenantId: tenant1.id,
        },
    })
    await prisma.product.create({
        data: {
            name: "Microsoft 365 Business Premium (Kullanıcı/Yıl)", sku: "LIC-M365-BP",
            description: "Microsoft 365 Business Premium yıllık abonelik - kullanıcı başına",
            price: 2999.99, costPrice: 2250, quantity: 999, minStock: 50, maxStock: 9999,
            unit: "lisans", categoryId: catYazilim.id, supplierId: supYazilim.id, tenantId: tenant1.id,
        },
    })
    await prisma.product.create({
        data: {
            name: "Windows 11 Pro OEM Lisans", sku: "LIC-WIN11-PRO",
            description: "Windows 11 Pro OEM lisans anahtarı",
            price: 3899.99, costPrice: 3200, quantity: 500, minStock: 25, maxStock: 1000,
            unit: "lisans", categoryId: catYazilim.id, supplierId: supYazilim.id, tenantId: tenant1.id,
        },
    })
    const _prodCleaner = await prisma.product.create({
        data: {
            name: "Endüstriyel Temizleyici (5 Litre)", sku: "CLN-IND-001",
            description: "Çok amaçlı endüstriyel yüzey temizleyici, konsantre 5L bidon",
            price: 349.99, costPrice: 210, quantity: 3, minStock: 20, maxStock: 100,
            unit: "bidon", categoryId: catTemizlik.id, supplierId: supHijyen.id, tenantId: tenant1.id,
        },
    })
    await prisma.product.create({
        data: {
            name: "Hijyenik El Dezenfektanı (1 Litre)", sku: "CLN-DEZ-001",
            description: "%70 alkol bazlı el dezenfektanı, pompalı 1L şişe",
            price: 189.99, costPrice: 110, quantity: 8, minStock: 30, maxStock: 200,
            unit: "şişe", categoryId: catTemizlik.id, supplierId: supHijyen.id, tenantId: tenant1.id,
        },
    })
    await prisma.product.create({
        data: {
            name: "Cisco Meraki MX68 Cloud Yönetimli Güvenlik Duvarı", sku: "NW-CISCO-001",
            description: "Cloud yönetimli güvenlik duvarı, 250 kullanıcı, SD-WAN destekli",
            price: 24999.99, costPrice: 19500, quantity: 5, minStock: 2, maxStock: 20,
            unit: "adet", categoryId: catAg.id, supplierId: supNetwork.id, tenantId: tenant1.id,
        },
    })
    await prisma.product.create({
        data: {
            name: "TP-Link Omada WiFi 6 Access Point", sku: "NW-TPL-001",
            description: "WiFi 6 (802.11ax) çift bantlı, PoE destekli akses noktası",
            price: 2899.99, costPrice: 2100, quantity: 25, minStock: 5, maxStock: 50,
            unit: "adet", categoryId: catAg.id, supplierId: supNetwork.id, tenantId: tenant1.id,
        },
    })
    console.log("✅ Ürünler oluşturuldu: 15")

    // ====================================================================
    //  CRM MODÜLÜ
    // ====================================================================

    // ── Müşteriler (Gerçekçi Türk firmaları) ─────────────────────────────
    const c1 = await prisma.customer.create({
        data: {
            firstName: "Mehmet", lastName: "Aksoy", email: "m.aksoy@ankarateknoloji.com.tr",
            phone: "+90 312 555 0101", company: "Ankara Teknoloji A.Ş.",
            jobTitle: "Satın Alma Müdürü", address: "Söğütözü Mah. Teknokent Cad. No:25",
            city: "Ankara", state: "Çankaya", country: "Türkiye", postalCode: "06530",
            status: "CUSTOMER", source: "TRADE_SHOW", totalSpent: 78999.97, orderCount: 3,
            taxId: "1234567890", taxOffice: "Çankaya VD",
            tenantId: tenant1.id,
        },
    })
    const c2 = await prisma.customer.create({
        data: {
            firstName: "Elif", lastName: "Kara", email: "e.kara@birmagroup.com",
            phone: "+90 212 555 0202", company: "Birma Group San. Tic. A.Ş.",
            jobTitle: "Finans Müdürü", address: "Levent Mah. Büyükdere Cad. No:120",
            city: "İstanbul", state: "Beşiktaş", country: "Türkiye", postalCode: "34330",
            status: "CUSTOMER", source: "REFERRAL", totalSpent: 45599.98, orderCount: 2,
            taxId: "2345678901", taxOffice: "Levent VD",
            tenantId: tenant1.id,
        },
    })
    const c3 = await prisma.customer.create({
        data: {
            firstName: "Ali", lastName: "Demirtaş", email: "ali.demirtas@egesistem.com.tr",
            phone: "+90 232 555 0303", company: "Ege Sistem Entegrasyon",
            jobTitle: "Genel Müdür", address: "Alsancak Mah. Kıbrıs Şehitleri Cad. No:45",
            city: "İzmir", state: "Konak", country: "Türkiye", postalCode: "35220",
            status: "CUSTOMER", source: "WEBSITE", totalSpent: 31249.99, orderCount: 1,
            taxId: "3456789012", taxOffice: "Alsancak VD",
            tenantId: tenant1.id,
        },
    })
    const _c4 = await prisma.customer.create({
        data: {
            firstName: "Ayşe", lastName: "Şahin", email: "a.sahin@karadenizlojistik.com",
            phone: "+90 462 555 0404", company: "Karadeniz Lojistik Ltd. Şti.",
            jobTitle: "Operasyon Direktörü", address: "Sahil Cad. No:78",
            city: "Trabzon", state: "Ortahisar", country: "Türkiye", postalCode: "61000",
            status: "QUALIFIED", source: "TRADE_SHOW", leadScore: 72,
            taxId: "4567890123", taxOffice: "Trabzon VD",
            tenantId: tenant1.id,
        },
    })
    const c5 = await prisma.customer.create({
        data: {
            firstName: "Can", lastName: "Yıldırım", email: "can.yildirim@pamukkaleinsaat.com",
            phone: "+90 258 555 0505", company: "Pamukkale İnşaat Turizm A.Ş.",
            jobTitle: "İhale Müdürü", address: "Gazi Bulvarı No:200",
            city: "Denizli", state: "Merkezefendi", country: "Türkiye", postalCode: "20010",
            status: "OPPORTUNITY", source: "COLD_CALL", leadScore: 85,
            taxId: "5678901234", taxOffice: "Denizli VD",
            tenantId: tenant1.id,
        },
    })
    const c6 = await prisma.customer.create({
        data: {
            firstName: "Duygu", lastName: "Öztürk", email: "duygu@akdeniztarim.com.tr",
            phone: "+90 324 555 0606", company: "Akdeniz Tarım Ürünleri San.",
            jobTitle: "İşletme Sahibi", address: "Adana Cad. No:55",
            city: "Mersin", state: "Yenişehir", country: "Türkiye", postalCode: "33110",
            status: "LEAD", source: "SOCIAL_MEDIA", leadScore: 35,
            taxId: "6789012345", taxOffice: "Mersin VD",
            tenantId: tenant1.id,
        },
    })
    const c7 = await prisma.customer.create({
        data: {
            firstName: "Burak", lastName: "Kaya", email: "b.kaya@dogubilişim.com",
            phone: "+90 442 555 0707", company: "Doğu Bilişim Teknoloji",
            jobTitle: "BT Müdürü", address: "İstasyon Cad. No:30",
            city: "Erzurum", state: "Yakutiye", country: "Türkiye", postalCode: "25000",
            status: "NEGOTIATION", source: "REFERRAL", leadScore: 92,
            taxId: "7890123456", taxOffice: "Erzurum VD",
            tenantId: tenant1.id,
        },
    })
    const c8 = await prisma.customer.create({
        data: {
            firstName: "Cem", lastName: "Arslan", email: "cem.arslan@marmaraenerji.com",
            phone: "+90 216 555 0808", company: "Marmara Enerji Dağıtım A.Ş.",
            jobTitle: "Satın Alma Şefi", address: "Rüzgarlıbahçe Mah. Şehitler Cad. No:15",
            city: "İstanbul", state: "Kavacık", country: "Türkiye", postalCode: "34810",
            status: "CHURNED", source: "DIRECT",
            taxId: "8901234567", taxOffice: "Kavacık VD",
            tenantId: tenant1.id,
        },
    })
    console.log("✅ Müşteriler oluşturuldu: 8")

    // ── Müşteri Etkileşimleri ─────────────────────────────────────────────
    await prisma.interaction.createMany({
        data: [
            {
                type: "CALL", subject: "Tanışma görüşmesi — Ankara Teknoloji",
                date: new Date("2024-10-05"), duration: 30,
                outcome: "Olumlu — ürünlerimizi inceliyorlar", customerId: c1.id, tenantId: tenant1.id,
            },
            {
                type: "EMAIL", subject: "Teklif gönderimi — 15 adet laptop",
                date: new Date("2024-10-10"), description: "DeftraBook Pro 15 için toplu alım teklifi gönderildi",
                customerId: c1.id, tenantId: tenant1.id,
            },
            {
                type: "MEETING", subject: "Sözleşme imzalama — Birma Group",
                date: new Date("2024-11-15"), duration: 90,
                outcome: "Yıllık bakım sözleşmesi imzalandı", customerId: c2.id, tenantId: tenant1.id,
            },
            {
                type: "DEMO", subject: "Ürün tanıtımı — Ege Sistem",
                date: new Date("2025-01-20"), duration: 60,
                outcome: "200 adetlik teklif hazırlanması kararlaştırıldı", customerId: c3.id, tenantId: tenant1.id,
            },
            {
                type: "CALL", subject: "Takip görüşmesi — Doğu Bilişim",
                date: new Date("2025-02-10"), duration: 25,
                outcome: "Proje onaylandı, bu ay içinde sipariş vermeyi planlıyor",
                nextAction: "Mart başında fiyat güncellemesi gönder", nextDate: new Date("2025-03-01"),
                customerId: c7.id, tenantId: tenant1.id,
            },
            {
                type: "NOTE", subject: "Müşteri kaybı analizi — Marmara Enerji",
                date: new Date("2025-01-25"),
                description: "Uygun fiyatlı rakip ürüne geçtiler. 6 ay sonra geri kazanım stratejisi planlanabilir.",
                customerId: c8.id, tenantId: tenant1.id,
            },
            {
                type: "TASK", subject: "Pamukkale İnşaat için teklif hazırla",
                date: new Date("2025-02-15"), duration: 120,
                outcome: "50+ kişilik ofis kurulumu için teklif gönderildi",
                nextAction: "1 hafta içinde geri dönüş bekleniyor", nextDate: new Date("2025-02-22"),
                customerId: c5.id, tenantId: tenant1.id,
            },
            {
                type: "CALL", subject: "Telefon görüşmesi — Akdeniz Tarım",
                date: new Date("2025-02-28"), duration: 15,
                outcome: "Sesli mesaj bırakıldı, daha sonra tekrar aranacak",
                customerId: c6.id, tenantId: tenant1.id,
            },
            {
                type: "FOLLOW_UP", subject: "Kurulum sonrası memnuniyet anketi — Ankara Teknoloji",
                date: new Date("2025-03-01"), duration: 20,
                outcome: "Çok memnunlar, referans olabilirler", customerId: c1.id, tenantId: tenant1.id,
            },
        ],
    })
    console.log("✅ Müşteri etkileşimleri oluşturuldu: 9")

    // ── Cari Hesaplar (Müşteri) ──────────────────────────────────────────
    const cariC1 = await prisma.customerAccount.create({
        data: {
            customerId: c1.id, accountCode: "CARİ-M-001",
            riskLimit: 150000, currentBalance: 78999.97, overdueBalance: 0,
            creditLimit: 200000, paymentTerms: 45, tenantId: tenant1.id,
        },
    })
    const cariC2 = await prisma.customerAccount.create({
        data: {
            customerId: c2.id, accountCode: "CARİ-M-002",
            riskLimit: 100000, currentBalance: 45599.98, overdueBalance: 0,
            creditLimit: 150000, paymentTerms: 30, tenantId: tenant1.id,
        },
    })
    const cariC3 = await prisma.customerAccount.create({
        data: {
            customerId: c3.id, accountCode: "CARİ-M-003",
            riskLimit: 80000, currentBalance: 31249.99, overdueBalance: 12499.99,
            creditLimit: 100000, paymentTerms: 60, notes: "Son ödemede 12.500 TL gecikme var",
            tenantId: tenant1.id,
        },
    })
    const _cariC7 = await prisma.customerAccount.create({
        data: {
            customerId: c7.id, accountCode: "CARİ-M-004",
            riskLimit: 200000, currentBalance: 0, overdueBalance: 0,
            creditLimit: 250000, paymentTerms: 45, notes: "Potansiyel yeni müşteri, limit yüksek",
            tenantId: tenant1.id,
        },
    })
    console.log("✅ Müşteri cari hesapları oluşturuldu: 4")

    // ── Cari Hesaplar (Tedarikçi) ────────────────────────────────────────
    await prisma.supplierAccount.create({
        data: {
            supplierId: supBilisim.id, accountCode: "CARİ-T-001",
            currentBalance: 135000, overdueBalance: 0,
            paymentTerms: 30, tenantId: tenant1.id,
        },
    })
    await prisma.supplierAccount.create({
        data: {
            supplierId: supOfis.id, accountCode: "CARİ-T-002",
            currentBalance: 85000, overdueBalance: 15000,
            paymentTerms: 45, notes: "15.000 TL gecikmeli fatura",
            tenantId: tenant1.id,
        },
    })
    await prisma.supplierAccount.create({
        data: {
            supplierId: supYazilim.id, accountCode: "CARİ-T-003",
            currentBalance: 45000, overdueBalance: 0,
            paymentTerms: 30, tenantId: tenant1.id,
        },
    })
    await prisma.supplierAccount.create({
        data: {
            supplierId: supNetwork.id, accountCode: "CARİ-T-004",
            currentBalance: 28000, overdueBalance: 0,
            paymentTerms: 30, tenantId: tenant1.id,
        },
    })
    console.log("✅ Tedarikçi cari hesapları oluşturuldu: 4")

    // ====================================================================
    //  İK MODÜLÜ
    // ====================================================================

    // ── Departmanlar ─────────────────────────────────────────────────────
    const deptYonetim = await prisma.department.create({
        data: { name: "Yönetim Kurulu", description: "Üst yönetim ve stratejik planlama", budget: 800000, tenantId: tenant1.id },
    })
    const deptIT = await prisma.department.create({
        data: { name: "Bilgi Teknolojileri", description: "Yazılım geliştirme, altyapı ve destek", code: "BT", budget: 600000, tenantId: tenant1.id },
    })
    const deptSatis = await prisma.department.create({
        data: { name: "Satış & Pazarlama", description: "Satış, pazarlama ve müşteri ilişkileri", code: "SAT", budget: 350000, tenantId: tenant1.id },
    })
    const deptHR = await prisma.department.create({
        data: { name: "İnsan Kaynakları", description: "İK yönetimi ve bordro", code: "IK", budget: 200000, tenantId: tenant1.id },
    })
    const deptFinans = await prisma.department.create({
        data: { name: "Finans & Muhasebe", description: "Finans, muhasebe ve raporlama", code: "FIN", budget: 250000, tenantId: tenant1.id },
    })
    const deptOps = await prisma.department.create({
        data: { name: "Operasyon & Lojistik", description: "Operasyon ve tedarik zinciri", code: "OPS", budget: 400000, tenantId: tenant1.id },
    })
    const deptArge = await prisma.department.create({
        data: { name: "Ar-Ge Merkezi", description: "Ürün geliştirme ve inovasyon", code: "ARGE", budget: 500000, tenantId: tenant1.id },
    })
    console.log("✅ Departmanlar oluşturuldu: 7")

    // Helper: encrypt KVKK fields for Employee
    const encryptEmployee = (data: {
        bankName?: string | null
        bankAccount?: string | null
        iban?: string | null
        taxId?: string | null
    }) => ({
        bankAccount: data.bankAccount ? encrypt(data.bankAccount) : undefined,
        iban: data.iban ? encrypt(data.iban) : undefined,
        taxId: data.taxId ? encrypt(data.taxId) : undefined,
    })

    // ── Çalışanlar ───────────────────────────────────────────────────────
    const empAhmet = await prisma.employee.create({
        data: {
            employeeId: "NX-001", firstName: "Ahmet", lastName: "Yıldırım",
            email: "ahmet.yildirim@deftra.com", phone: "+90 532 111 0001",
            position: "CEO / Genel Müdür", status: "ACTIVE",
            hireDate: new Date("2020-01-01"), salary: 120000, salaryType: "monthly",
            employmentType: "FULL_TIME",
            address: "Maslak Mah. No:10", city: "İstanbul", state: "Sarıyer",
            emergencyContact: "Fatma Yıldırım (Eş)", emergencyPhone: "+90 532 111 0099",
            bankName: "Garanti BBVA",
            ...encryptEmployee({
                iban: "TR12000123456789000001",
                taxId: "10000000001",
            }),
            departmentId: deptYonetim.id, userId: adminUser.id,
            tenantId: tenant1.id,
        },
    })
    const empAyse = await prisma.employee.create({
        data: {
            employeeId: "NX-002", firstName: "Ayşe", lastName: "Kaya",
            email: "ayse.kaya@deftra.com", phone: "+90 532 111 0002",
            position: "Satış Direktörü", status: "ACTIVE",
            hireDate: new Date("2021-03-15"), salary: 85000,
            employmentType: "FULL_TIME",
            bankName: "T.C. Ziraat Bankası",
            ...encryptEmployee({
                iban: "TR34000123456789000002",
                taxId: "10000000002",
            }),
            departmentId: deptSatis.id, userId: managerUser.id,
            tenantId: tenant1.id,
        },
    })
    const empMehmet = await prisma.employee.create({
        data: {
            employeeId: "NX-003", firstName: "Mehmet", lastName: "Demir",
            email: "mehmet.demir@deftra.com", phone: "+90 532 111 0003",
            position: "Kıdemli Yazılım Geliştirici", status: "ACTIVE",
            hireDate: new Date("2022-01-10"), salary: 72000,
            employmentType: "FULL_TIME",
            bankName: "T.C. Ziraat Bankası",
            ...encryptEmployee({
                iban: "TR56000123456789000003",
                taxId: "10000000003",
            }),
            departmentId: deptIT.id,
            tenantId: tenant1.id,
        },
    })
    const empZeynep = await prisma.employee.create({
        data: {
            employeeId: "NX-004", firstName: "Zeynep", lastName: "Çelik",
            email: "zeynep.celik@deftra.com", phone: "+90 532 111 0004",
            position: "Finans Müdürü", status: "ACTIVE",
            hireDate: new Date("2021-09-01"), salary: 78000,
            employmentType: "FULL_TIME",
            bankName: "Akbank",
            ...encryptEmployee({
                iban: "TR78000123456789000004",
                taxId: "10000000004",
            }),
            departmentId: deptFinans.id,
            tenantId: tenant1.id,
        },
    })
    const _empCan = await prisma.employee.create({
        data: {
            employeeId: "NX-005", firstName: "Can", lastName: "Öztürk",
            email: "can.ozturk@deftra.com", phone: "+90 532 111 0005",
            position: "Operasyon Müdürü", status: "ACTIVE",
            hireDate: new Date("2022-06-15"), salary: 65000,
            employmentType: "FULL_TIME",
            bankName: "Yapı Kredi",
            ...encryptEmployee({
                iban: "TR90000123456789000005",
                taxId: "10000000005",
            }),
            departmentId: deptOps.id,
            tenantId: tenant1.id,
        },
    })
    const empAli = await prisma.employee.create({
        data: {
            employeeId: "NX-006", firstName: "Ali", lastName: "Kara",
            email: "ali.kara@deftra.com", phone: "+90 532 111 0006",
            position: "İK Uzmanı", status: "ACTIVE",
            hireDate: new Date("2023-03-10"), salary: 38000,
            employmentType: "FULL_TIME",
            bankName: "T.C. Ziraat Bankası",
            ...encryptEmployee({
                iban: "TR11000123456789000006",
                taxId: "10000000006",
            }),
            departmentId: deptHR.id,
            tenantId: tenant1.id,
        },
    })
    const empDerya = await prisma.employee.create({
        data: {
            employeeId: "NX-007", firstName: "Derya", lastName: "Aksoy",
            email: "derya.aksoy@deftra.com", phone: "+90 532 111 0007",
            position: "Frontend Geliştirici", status: "ACTIVE",
            hireDate: new Date("2023-06-01"), salary: 45000,
            employmentType: "FULL_TIME",
            bankName: "Garanti BBVA",
            ...encryptEmployee({
                iban: "TR22000123456789000007",
                taxId: "10000000007",
            }),
            departmentId: deptIT.id, managerId: empMehmet.id,
            tenantId: tenant1.id,
        },
    })
    const empBurak = await prisma.employee.create({
        data: {
            employeeId: "NX-008", firstName: "Burak", lastName: "Şahin",
            email: "burak.sahin@deftra.com", phone: "+90 532 111 0008",
            position: "Satış Temsilcisi", status: "ON_LEAVE",
            hireDate: new Date("2023-11-01"), salary: 32000,
            employmentType: "FULL_TIME",
            bankName: "Türkiye İş Bankası",
            ...encryptEmployee({
                iban: "TR33000123456789000008",
                taxId: "10000000008",
            }),
            departmentId: deptSatis.id, managerId: empAyse.id,
            tenantId: tenant1.id,
        },
    })
    const empEce = await prisma.employee.create({
        data: {
            employeeId: "NX-009", firstName: "Ece", lastName: "Yıldız",
            email: "ece.yildiz@deftra.com", phone: "+90 532 111 0009",
            position: "Stajyer Yazılım Geliştirici", status: "PROBATION",
            hireDate: new Date("2025-01-15"), salary: 18000,
            employmentType: "INTERN",
            bankName: "T.C. Ziraat Bankası",
            ...encryptEmployee({
                iban: "TR44000123456789000009",
                taxId: "10000000009",
            }),
            departmentId: deptIT.id, managerId: empMehmet.id,
            tenantId: tenant1.id,
        },
    })
    const empMurat = await prisma.employee.create({
        data: {
            employeeId: "NX-010", firstName: "Murat", lastName: "Polat",
            email: "murat.polat@deftra.com", phone: "+90 532 111 0010",
            position: "Ar-Ge Mühendisi", status: "ACTIVE",
            hireDate: new Date("2024-02-01"), salary: 52000,
            employmentType: "FULL_TIME",
            bankName: "Akbank",
            ...encryptEmployee({
                iban: "TR55000123456789000010",
                taxId: "10000000010",
            }),
            departmentId: deptArge.id,
            tenantId: tenant1.id,
        },
    })
    console.log("✅ Çalışanlar oluşturuldu: 10")

    // ── İzin Talepleri ───────────────────────────────────────────────────
    await prisma.leaveRequest.createMany({
        data: [
            {
                employeeId: empAhmet.id, type: "ANNUAL",
                startDate: new Date("2025-07-15"), endDate: new Date("2025-07-25"),
                totalDays: 10, reason: "Yıllık izin — Aile tatili",
                status: "PENDING", tenantId: tenant1.id,
            },
            {
                employeeId: empZeynep.id, type: "ANNUAL",
                startDate: new Date("2025-06-01"), endDate: new Date("2025-06-07"),
                totalDays: 7, reason: "Yıllık izin — Yurt dışı seyahati",
                status: "APPROVED", reviewedBy: empAhmet.id,
                reviewedAt: new Date("2025-05-01"),
                tenantId: tenant1.id,
            },
            {
                employeeId: empAli.id, type: "SICK",
                startDate: new Date("2025-02-20"), endDate: new Date("2025-02-21"),
                totalDays: 2, reason: "Grip rahatsızlığı",
                status: "APPROVED", reviewedBy: empAyse.id,
                reviewedAt: new Date("2025-02-20"),
                tenantId: tenant1.id,
            },
            {
                employeeId: empBurak.id, type: "ANNUAL",
                startDate: new Date("2025-03-01"), endDate: new Date("2025-03-15"),
                totalDays: 15, reason: "Yurt dışı seyahati",
                status: "APPROVED", reviewedBy: empAyse.id,
                reviewedAt: new Date("2025-02-25"),
                tenantId: tenant1.id,
            },
            {
                employeeId: empEce.id, type: "PERSONAL",
                startDate: new Date("2025-03-05"), endDate: new Date("2025-03-05"),
                totalDays: 1, reason: "Şahsi işler",
                status: "PENDING", tenantId: tenant1.id,
            },
            {
                employeeId: empDerya.id, type: "COMPENSATORY",
                startDate: new Date("2025-03-20"), endDate: new Date("2025-03-21"),
                totalDays: 2, reason: "Hafta sonu çalışma telafisi",
                status: "APPROVED", reviewedBy: empMehmet.id,
                reviewedAt: new Date("2025-03-18"),
                tenantId: tenant1.id,
            },
            {
                employeeId: empMurat.id, type: "MATERNITY",
                startDate: new Date("2025-05-01"), endDate: new Date("2025-08-28"),
                totalDays: 120, reason: "Doğum izni",
                status: "PENDING", tenantId: tenant1.id,
            },
        ],
    })
    console.log("✅ İzin talepleri oluşturuldu: 7")

    // ====================================================================
    //  FİNANS MODÜLÜ
    // ====================================================================

    // ── Siparişler ───────────────────────────────────────────────────────
    const ord1 = await prisma.order.create({
        data: {
            orderNumber: "SIP-2024-001", status: "COMPLETED",
            subtotal: 78999.97, taxRate: 18, taxAmount: 14219.99, taxDetails: { kdv: 14219.99 },
            total: 78999.97, currency: "TRY",
            paymentMethod: "Banka Havalesi", paymentStatus: "paid",
            paidAt: new Date("2024-12-15"),
            shippingAddress: "Söğütözü Mah. Teknokent Cad. No:25, Ankara",
            billingAddress: "Söğütözü Mah. Teknokent Cad. No:25, Ankara",
            dueDate: new Date("2024-12-30"),
            customerId: c1.id, costCenterId: ccPazarlama.id, tenantId: tenant1.id,
            items: {
                create: [
                    { productId: prodLaptop.id, productName: "DeftraBook Pro 15\" İş Bilgisayarı", productSku: "LAPTOP-NX-001", quantity: 1, unitPrice: 45999.99, total: 45999.99 },
                    { productId: prodMonitor.id, productName: 'Dell UltraSharp 27" 4K IPS Monitör', productSku: "MON-DELL-001", quantity: 1, unitPrice: 18999.99, total: 18999.99 },
                    { productId: prodChair.id, productName: "Ergonomik Ofis Koltuğu (Sırt Destekli)", productSku: "FRN-CHAIR-001", quantity: 2, unitPrice: 6999.99, total: 13999.99, discount: 1000, taxRate: 18 },
                ],
            },
        },
    })
    const ord2 = await prisma.order.create({
        data: {
            orderNumber: "SIP-2024-002", status: "COMPLETED",
            subtotal: 45599.98, taxRate: 18, taxAmount: 8207.99,
            total: 45599.98, currency: "TRY",
            paymentMethod: "Kredi Kartı", paymentStatus: "paid",
            paidAt: new Date("2025-01-20"),
            customerId: c2.id, costCenterId: ccIT.id, tenantId: tenant1.id,
            items: {
                create: [
                    { productId: prodLaptop.id, productName: "DeftraBook Pro 15\" İş Bilgisayarı", productSku: "LAPTOP-NX-001", quantity: 1, unitPrice: 45999.99, total: 45999.99, taxRate: 18 },
                ],
            },
        },
    })
    const ord3 = await prisma.order.create({
        data: {
            orderNumber: "SIP-2025-001", status: "PROCESSING",
            subtotal: 31249.99, taxRate: 18, taxAmount: 5625.00,
            total: 31249.99, currency: "TRY",
            paymentMethod: "Banka Havalesi", paymentStatus: "partial",
            internalNotes: "Kısmi ödeme alındı, 12.500 TL bakiye var",
            customerId: c3.id, costCenterId: ccGenel.id, tenantId: tenant1.id,
            items: {
                create: [
                    { productId: prodDesk.id, productName: "Executive Ofis Masası (Ceviz)", productSku: "FRN-DESK-001", quantity: 2, unitPrice: 8999.99, total: 17999.98, taxRate: 18 },
                    { productId: prodChair.id, productName: "Ergonomik Ofis Koltuğu (Sırt Destekli)", productSku: "FRN-CHAIR-001", quantity: 4, unitPrice: 5999.99, total: 23999.96, taxRate: 18, discount: 750 },
                ],
            },
        },
    })
    await prisma.order.create({
        data: {
            orderNumber: "SIP-2025-002", status: "PENDING",
            subtotal: 4999.98, taxRate: 18, taxAmount: 899.99,
            total: 4999.98, currency: "TRY",
            customerId: c1.id, costCenterId: ccPazarlama.id, tenantId: tenant1.id,
            items: {
                create: [
                    { productId: prodWebcam.id, productName: "Logitech C920 HD Webcam 1080p", productSku: "CAM-LOG-001", quantity: 2, unitPrice: 2499.99, total: 4999.98, taxRate: 18 },
                ],
            },
        },
    })
    await prisma.order.create({
        data: {
            orderNumber: "SIP-2025-003", status: "DRAFT",
            subtotal: 0, total: 0, currency: "TRY",
            customerId: c5.id, costCenterId: ccPazarlama.id, tenantId: tenant1.id,
        },
    })
    console.log("✅ Siparişler oluşturuldu: 5")

    // ── Finansal İşlemler ─────────────────────────────────────────────────
    await prisma.transaction.createMany({
        data: [
            {
                type: "INCOME", amount: 78999.97, description: "Ankara Teknoloji — Sipariş ödemesi (SIP-2024-001)",
                category: "Satış", date: new Date("2024-12-15"), status: "COMPLETED",
                costCenterId: ccPazarlama.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "INCOME", amount: 45599.98, description: "Birma Group — Sipariş ödemesi (SIP-2024-002)",
                category: "Satış", date: new Date("2025-01-20"), status: "COMPLETED",
                costCenterId: ccIT.id, bankAccountId: bankGarantiUSD.id,
                tenantId: tenant1.id,
            },
            {
                type: "INCOME", amount: 18750.00, description: "Ege Sistem — Kısmi ödeme (SIP-2025-001)",
                category: "Satış", date: new Date("2025-02-10"), status: "COMPLETED",
                costCenterId: ccGenel.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "INCOME", amount: 25000, description: "Danışmanlık Projesi — Q1 2025",
                category: "Danışmanlık", date: new Date("2025-02-01"), status: "COMPLETED",
                costCenterId: ccIT.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "INCOME", amount: 12500, description: "Yazılım Lisans Yenileme — Ankara Teknoloji",
                category: "Satış", date: new Date("2025-03-01"), status: "COMPLETED",
                costCenterId: ccIT.id, bankAccountId: bankIsTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 45000, description: "Ofis kirası — Mart 2025 (Maslak ofis)",
                category: "Kira", date: new Date("2025-03-01"), status: "COMPLETED",
                costCenterId: ccGenel.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 12400, description: "Elektrik, su, doğalgaz — Şubat 2025",
                category: "Faturalar", date: new Date("2025-02-15"), status: "COMPLETED",
                costCenterId: ccGenel.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 248000, description: "Maaş ödemeleri — Şubat 2025",
                category: "Maaş", date: new Date("2025-02-28"), status: "COMPLETED",
                costCenterId: ccGenel.id, bankAccountId: bankIsTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 3200, description: "Ofis malzemeleri — Kırtasiye alımı",
                category: "Ofis Giderleri", date: new Date("2025-02-05"), status: "COMPLETED",
                costCenterId: ccGenel.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 15000, description: "Bilişim Teknoloji A.Ş. — Laptop alımı",
                category: "Envanter", date: new Date("2025-02-20"), status: "COMPLETED",
                costCenterId: ccIT.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 8500, description: "Network Plus — Ağ ekipmanı alımı",
                category: "Envanter", date: new Date("2025-01-15"), status: "COMPLETED",
                costCenterId: ccIT.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "EXPENSE", amount: 2800, description: "Web hosting & domain yenileme (yıllık)",
                category: "BT Giderleri", date: new Date("2025-03-05"), status: "PENDING",
                costCenterId: ccIT.id, bankAccountId: bankZiraatTL.id,
                tenantId: tenant1.id,
            },
            {
                type: "TRANSFER", amount: 50000, description: "TL'den USD'ye transfer — İhracat hesabı",
                category: "Döviz İşlemi", date: new Date("2025-02-25"), status: "COMPLETED",
                costCenterId: ccGenel.id,
                tenantId: tenant1.id,
            },
            {
                type: "INCOME", amount: 45000, description: "İhracat geliri — Azerbaycan müşteri",
                category: "İhracat", date: new Date("2025-03-10"), status: "PENDING",
                costCenterId: ccPazarlama.id, bankAccountId: bankGarantiUSD.id,
                tenantId: tenant1.id,
            },
        ],
    })
    console.log("✅ Finansal işlemler oluşturuldu: 14")

    // ====================================================================
    //  TÜRK MUHASEBE MODÜLÜ — e-Fatura, Çek/Senet, Kayıtlar
    // ====================================================================

    // ── e-Faturalar ──────────────────────────────────────────────────────
    await prisma.eInvoice.create({
        data: {
            uuid: "einv-001-nexus-2024-0001",
            documentType: "INVOICE", profile: "TICARIFATURA",
            invoiceNumber: "NEX2024000000001",
            status: "GIB_ACCEPTED",
            senderTaxId: "12345678901", senderName: "Deftra Teknoloji A.Ş.",
            receiverTaxId: "1234567890", receiverName: "Ankara Teknoloji A.Ş.",
            receiverEmail: "muhasebe@ankarateknoloji.com.tr",
            grossTotal: 78999.97, vatBaseTotal: 66949.14, vatTotal: 12050.83, netTotal: 78999.97,
            currency: "TRY",
            issueDate: new Date("2024-12-15"), dueDate: new Date("2024-12-30"),
            hash: "a1b2c3d4e5...", signature: "MaliMühür-XXXX-1234",
            orderId: ord1.id, tenantId: tenant1.id,
        },
    })
    await prisma.eInvoice.create({
        data: {
            uuid: "einv-002-nexus-2024-0002",
            documentType: "INVOICE", profile: "TICARIFATURA",
            invoiceNumber: "NEX2024000000002",
            status: "GIB_ACCEPTED",
            senderTaxId: "12345678901", senderName: "Deftra Teknoloji A.Ş.",
            receiverTaxId: "2345678901", receiverName: "Birma Group San. Tic. A.Ş.",
            receiverEmail: "finans@birmagroup.com",
            grossTotal: 45599.98, vatBaseTotal: 38644.05, vatTotal: 6955.93, netTotal: 45599.98,
            currency: "TRY",
            issueDate: new Date("2024-12-28"), dueDate: new Date("2025-01-27"),
            hash: "b2c3d4e5f6...", signature: "MaliMühür-XXXX-5678",
            orderId: ord2.id, tenantId: tenant1.id,
        },
    })
    await prisma.eInvoice.create({
        data: {
            uuid: "einv-003-nexus-2025-0001",
            documentType: "INVOICE", profile: "EARSIVFATURA",
            invoiceNumber: "NEX2025000000001",
            status: "SENT_TO_GIB",
            senderTaxId: "12345678901", senderName: "Deftra Teknoloji A.Ş.",
            receiverTaxId: "3456789012", receiverName: "Ege Sistem Entegrasyon",
            receiverEmail: "muhasebe@egesistem.com.tr",
            grossTotal: 31249.99, vatBaseTotal: 26483.04, vatTotal: 4766.95, netTotal: 31249.99,
            currency: "TRY",
            issueDate: new Date("2025-01-25"), dueDate: new Date("2025-03-26"),
            hash: "c3d4e5f6a7...", signature: "MaliMühür-XXXX-9012",
            orderId: ord3.id, tenantId: tenant1.id,
        },
    })
    await prisma.eInvoice.create({
        data: {
            uuid: "einv-004-nexus-2025-0002",
            documentType: "ARCHIVE", profile: "EARSIVFATURA",
            invoiceNumber: "NEX2025000000002",
            status: "DRAFT",
            senderTaxId: "12345678901", senderName: "Deftra Teknoloji A.Ş.",
            receiverTaxId: "7890123456", receiverName: "Doğu Bilişim Teknoloji",
            receiverEmail: "satinalma@dogubilisim.com",
            grossTotal: 25000, vatBaseTotal: 21186.44, vatTotal: 3813.56, netTotal: 25000,
            currency: "TRY",
            issueDate: new Date("2025-03-01"), dueDate: new Date("2025-03-31"),
            notes: "Teklif aşamasında, müşteri onayı bekliyor",
            tenantId: tenant1.id,
        },
    })
    console.log("✅ e-Faturalar oluşturuldu: 4")

    // ── Çek / Senet ──────────────────────────────────────────────────────
    await prisma.checkPromissoryNote.create({
        data: {
            type: "CHECK", direction: "RECEIVED",
            serialNumber: "CHK-001-2025",
            bankName: "Garanti BBVA", bankBranch: "Maslak Şubesi", accountNumber: "1234567",
            issuerName: "Ankara Teknoloji A.Ş.", issuerTaxId: "1234567890",
            amount: 25000, currency: "TRY",
            issueDate: new Date("2025-01-15"), maturityDate: new Date("2025-04-15"),
            status: "IN_PORTFOLIO", customerId: c1.id,
            bankAccountId: bankGarantiUSD.id, tenantId: tenant1.id,
        },
    })
    await prisma.checkPromissoryNote.create({
        data: {
            type: "PROMISSORY_NOTE", direction: "RECEIVED",
            serialNumber: "SNT-001-2025",
            issuerName: "Birma Group San. Tic. A.Ş.", issuerTaxId: "2345678901",
            amount: 45599.98, currency: "TRY",
            issueDate: new Date("2024-12-28"), maturityDate: new Date("2025-04-28"),
            status: "DEPOSITED", collectionDate: new Date("2025-01-20"), collectionAmount: 45599.98,
            customerId: c2.id, bankAccountId: bankZiraatTL.id, tenantId: tenant1.id,
            notes: "Bankaya tahsilata verildi",
        },
    })
    await prisma.checkPromissoryNote.create({
        data: {
            type: "CHECK", direction: "ISSUED",
            serialNumber: "CHK-OUT-001-2025",
            bankName: "T.C. Ziraat Bankası", bankBranch: "Levent Şubesi",
            issuerName: "Deftra Teknoloji A.Ş.", issuerTaxId: "12345678901",
            amount: 45000, currency: "TRY",
            issueDate: new Date("2025-02-25"), maturityDate: new Date("2025-03-25"),
            status: "IN_PORTFOLIO", tenantId: tenant1.id,
            notes: "Ofis kirası ödemesi için keşide edildi",
        },
    })
    await prisma.checkPromissoryNote.create({
        data: {
            type: "PROMISSORY_NOTE", direction: "RECEIVED",
            serialNumber: "SNT-PRO-001-2025",
            issuerName: "Ege Sistem Entegrasyon", issuerTaxId: "3456789012",
            amount: 12500, currency: "TRY",
            issueDate: new Date("2025-01-25"), maturityDate: new Date("2025-04-25"),
            status: "BOUNCED", protestDate: new Date("2025-02-20"), protestFee: 350,
            customerId: c3.id, tenantId: tenant1.id,
            notes: "Karşılıksız çıktı — protesto edildi. Yasal takip başlatılacak.",
        },
    })
    console.log("✅ Çek/Senet kayıtları oluşturuldu: 4")

    // ── Muhasebe Kayıtları (Account Entries) ────────────────────────────
    const _entry1 = await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2024-001", entryType: "DEBIT_NOTE",
            description: "Ankara Teknoloji A.Ş.'den tahsilat",
            entryDate: new Date("2024-12-15"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "DEBIT", amount: 78999.97, description: "Ziraat Bankası TL hesabı", bankAccountId: bankZiraatTL.id },
                    { side: "CREDIT", amount: 78999.97, description: "Ankara Teknoloji Cari Hesap", customerAccountId: cariC1.id },
                ],
            },
        },
    })
    const _entry2 = await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2024-002", entryType: "CREDIT_NOTE",
            description: "Birma Group'tan tahsilat",
            entryDate: new Date("2025-01-20"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "DEBIT", amount: 45599.98, description: "Ziraat Bankası TL hesabı", bankAccountId: bankZiraatTL.id },
                    { side: "CREDIT", amount: 45599.98, description: "Birma Group Cari Hesap", customerAccountId: cariC2.id },
                ],
            },
        },
    })
    await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2025-001", entryType: "OPENING",
            description: "2025 yılı açılış fişi — Devir bakiyeleri",
            entryDate: new Date("2025-01-01"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "DEBIT", amount: 1500000, description: "Ziraat Bankası TL hesabı devir", bankAccountId: bankZiraatTL.id },
                    { side: "DEBIT", amount: 500000, description: "Garanti USD hesabı devir", bankAccountId: bankGarantiUSD.id },
                    { side: "CREDIT", amount: 2000000, description: "Cari hesaplar devir bakiyesi" },
                ],
            },
        },
    })
    await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2025-002", entryType: "DEBIT_NOTE",
            description: "Ege Sistem kısmi tahsilat",
            entryDate: new Date("2025-02-10"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "DEBIT", amount: 18750.00, description: "İş Bankası TL hesabı", bankAccountId: bankIsTL.id },
                    { side: "CREDIT", amount: 18750.00, description: "Ege Sistem Cari Hesap — Kısmi ödeme", customerAccountId: cariC3.id },
                ],
            },
        },
    })
    await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2025-003", entryType: "TRANSFER",
            description: "TL'den USD'ye döviz transferi",
            entryDate: new Date("2025-02-25"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "CREDIT", amount: 50000, description: "Ziraat Bankası TL (çıkış)", bankAccountId: bankZiraatTL.id },
                    { side: "DEBIT", amount: 1365, description: "Garanti USD hesabı (giriş, kur: 36.63)", bankAccountId: bankGarantiUSD.id },
                ],
            },
        },
    })
    await prisma.accountEntry.create({
        data: {
            entryNumber: "FIS-2025-004", entryType: "CORRECTION",
            description: "Enflasyon düzeltmesi — Şubat 2025",
            entryDate: new Date("2025-02-28"), tenantId: tenant1.id,
            lines: {
                create: [
                    { side: "DEBIT", amount: 12500, description: "Enflasyon farkı gideri", costCenterId: ccGenel.id },
                    { side: "CREDIT", amount: 12500, description: "Düzeltilmiş değer artışı" },
                ],
            },
        },
    })
    console.log("✅ Muhasebe kayıtları oluşturuldu: 6")

    // ── BA/BS Formları ──────────────────────────────────────────────────
    await prisma.baBsForm.create({
        data: {
            formType: "BS", year: 2024, month: 12,
            status: "SUBMITTED", submittedAt: new Date("2025-01-15"),
            items: {
                create: [
                    { taxId: "1234567890", name: "Ankara Teknoloji A.Ş.", documentCount: 2, totalAmount: 124599.95 },
                    { taxId: "2345678901", name: "Birma Group San. Tic. A.Ş.", documentCount: 1, totalAmount: 45599.98 },
                ],
            },
            tenantId: tenant1.id,
        },
    })
    await prisma.baBsForm.create({
        data: {
            formType: "BA", year: 2025, month: 1,
            status: "DRAFT",
            items: {
                create: [
                    { taxId: "5678901234", name: "Bilişim Teknoloji A.Ş.", documentCount: 3, totalAmount: 85000 },
                    { taxId: "6789012345", name: "Ofis Dünyası Tic. Ltd. Şti.", documentCount: 2, totalAmount: 45000 },
                    { taxId: "7890123456", name: "Yazılım Çözümleri A.Ş.", documentCount: 1, totalAmount: 28000 },
                ],
            },
            tenantId: tenant1.id,
        },
    })
    console.log("✅ BA/BS formları oluşturuldu: 2")

    // ====================================================================
    //  AKTİVİTE LOGLARI (Örnek kayıtlar)
    // ====================================================================
    await prisma.activityLog.createMany({
        data: [
            { action: "CREATE", entityType: "Order", entityId: ord1.id, description: "Ankara Teknoloji A.Ş. için sipariş oluşturuldu", userId: adminUser.id, tenantId: tenant1.id },
            { action: "UPDATE", entityType: "Order", entityId: ord1.id, description: "Sipariş durumu COMPLETED olarak güncellendi", userId: adminUser.id, tenantId: tenant1.id },
            { action: "CREATE", entityType: "EInvoice", description: "e-Fatura oluşturuldu: NEX2024000000001", userId: adminUser.id, tenantId: tenant1.id },
            { action: "CREATE", entityType: "Employee", entityId: empEce.id, description: "Yeni çalışan eklendi: Ece Yıldız (Stajyer)", userId: adminUser.id, tenantId: tenant1.id },
            { action: "UPDATE", entityType: "Inventory", description: "Stok uyarısı: HD Webcam stoğu 8'e düştü (min: 10)", tenantId: tenant1.id },
            { action: "UPDATE", entityType: "LeaveRequest", description: "Burak Şahin için yıllık izin onaylandı (15 gün)", userId: managerUser.id, tenantId: tenant1.id },
        ],
    })
    console.log("✅ Aktivite logları oluşturuldu\n")


    // ====================================================================
    //  TENANT 2 — İnovasyon Ltd. Şti. (STARTER plan)
    //  Küçük ölçekli Türk yazılım şirketi (multi-tenancy demo)
    // ====================================================================
    const tenant2 = await prisma.tenant.create({
        data: {
            name: "İnovasyon Yazılım Ltd. Şti.",
            slug: "inovasyon-yazilim",
            plan: "STARTER",
            isActive: true,
        },
    })
    console.log(`✅ Tenant oluşturuldu: ${tenant2.name} (${tenant2.plan})`)

    const pwStartup = await hash("startup123")
    await prisma.user.create({
        data: { email: "admin@inovasyon.com.tr", name: "Deniz Yılmaz (Admin)", password: pwStartup, role: "ADMIN", tenantId: tenant2.id },
    })
    await prisma.user.create({
        data: { email: "user@inovasyon.com.tr", name: "Selin Aydın (User)", password: pwUser, role: "USER", tenantId: tenant2.id },
    })

    // ── Para Birimleri (Tenant 2) ───────────────────────────────────────
    const cur2TRY = await prisma.currency.create({
        data: { code: "TRY", name: "Türk Lirası", symbol: "₺", isDefault: true, tenantId: tenant2.id },
    })
    const cur2USD = await prisma.currency.create({
        data: { code: "USD", name: "ABD Doları", symbol: "$", tenantId: tenant2.id },
    })
    await prisma.currencyExchangeRate.create({
        data: { fromCurrencyId: cur2USD.id, toCurrencyId: cur2TRY.id, rate: 36.55, date: now, source: "TCMB", tenantId: tenant2.id },
    })

    // ── Vergi Türleri (Tenant 2) ────────────────────────────────────────
    await prisma.taxType.createMany({
        data: [
            { code: "KDV1", name: "%1 KDV", rate: 1, category: "VAT", tenantId: tenant2.id },
            { code: "KDV2", name: "%8 KDV", rate: 8, category: "VAT", tenantId: tenant2.id },
            { code: "KDV3", name: "%18 KDV", rate: 18, category: "VAT", tenantId: tenant2.id },
        ],
    })

    // ── Masraf Merkezleri (Tenant 2) ────────────────────────────────────
    await prisma.costCenter.create({ data: { code: "CC2-001", name: "Genel Giderler", tenantId: tenant2.id } })
    await prisma.costCenter.create({ data: { code: "CC2-002", name: "Proje Giderleri", tenantId: tenant2.id } })

    // ── Banka Hesapları (Tenant 2) ──────────────────────────────────────
    await prisma.bankAccount.create({
        data: {
            bankName: "T.C. Ziraat Bankası", branchName: "Bornova Şubesi",
            accountNumber: "TR22-9988-7766-5544", iban: "TR22998877665544000001",
            accountType: "CHECKING", currency: "TRY", balance: 450000,
            tenantId: tenant2.id,
        },
    })

    // ── Kategoriler (Tenant 2) ──────────────────────────────────────────
    const cat2Yazilim = await prisma.category.create({
        data: { name: "Yazılım Hizmetleri", slug: "yazilim-hizmetleri", color: "#14B8A6", tenantId: tenant2.id },
    })
    const cat2Donanim = await prisma.category.create({
        data: { name: "Donanım", slug: "donanim", color: "#F97316", tenantId: tenant2.id },
    })

    // ── Tedarikçi (Tenant 2) ────────────────────────────────────────────
    const sup2Bulut = await prisma.supplier.create({
        data: { name: "Bulut Bilişim Hizmetleri Ltd.", contactName: "Eren Korkmaz", email: "info@bulutbilisim.com", phone: "+90 232 555 0101", city: "İzmir", tenantId: tenant2.id },
    })

    // ── Ürünler (Tenant 2) ──────────────────────────────────────────────
    await prisma.product.create({
        data: { name: "Web Sitesi Paketi (Kurumsal)", sku: "WEB-PCK-001", price: 14999.99, costPrice: 8000, quantity: 999, minStock: 1, categoryId: cat2Yazilim.id, tenantId: tenant2.id },
    })
    await prisma.product.create({
        data: { name: "Mobil Uygulama Geliştirme (Saatlik)", sku: "MOB-DEV-001", price: 2499.99, costPrice: 1500, quantity: 999, minStock: 1, unit: "saat", categoryId: cat2Yazilim.id, tenantId: tenant2.id },
    })
    await prisma.product.create({
        data: { name: "Harici SSD 1TB", sku: "SSD-1TB-001", price: 2499.99, costPrice: 1800, quantity: 12, minStock: 5, categoryId: cat2Donanim.id, supplierId: sup2Bulut.id, tenantId: tenant2.id },
    })
    await prisma.product.create({
        data: { name: "Docking Station USB-C", sku: "DOCK-001", price: 1899.99, costPrice: 1350, quantity: 3, minStock: 5, categoryId: cat2Donanim.id, supplierId: sup2Bulut.id, tenantId: tenant2.id },
    })

    // ── Departmanlar (Tenant 2) ─────────────────────────────────────────
    const dept2Yazilim = await prisma.department.create({
        data: { name: "Yazılım Geliştirme", description: "Full-stack geliştirme ekibi", budget: 250000, tenantId: tenant2.id },
    })
    const dept2Pazarlama = await prisma.department.create({
        data: { name: "Pazarlama", description: "Dijital pazarlama", budget: 80000, tenantId: tenant2.id },
    })

    // ── Çalışanlar (Tenant 2) ───────────────────────────────────────────
    await prisma.employee.create({
        data: { employeeId: "INV-001", firstName: "Deniz", lastName: "Yılmaz", email: "deniz.yilmaz@inovasyon.com.tr", position: "CEO / Kurucu", status: "ACTIVE", hireDate: new Date("2024-01-01"), salary: 65000, departmentId: dept2Yazilim.id, tenantId: tenant2.id },
    })
    await prisma.employee.create({
        data: { employeeId: "INV-002", firstName: "Selin", lastName: "Aydın", email: "selin.aydin@inovasyon.com.tr", position: "Full Stack Geliştirici", status: "ACTIVE", hireDate: new Date("2024-03-01"), salary: 42000, departmentId: dept2Yazilim.id, tenantId: tenant2.id },
    })
    await prisma.employee.create({
        data: { employeeId: "INV-003", firstName: "Kaan", lastName: "Tekin", email: "kaan.tekin@inovasyon.com.tr", position: "Pazarlama Uzmanı", status: "PROBATION", hireDate: new Date("2025-02-01"), salary: 25000, departmentId: dept2Pazarlama.id, tenantId: tenant2.id },
    })

    // ── Müşteriler (Tenant 2) ───────────────────────────────────────────
    await prisma.customer.create({
        data: { firstName: "Aslı", lastName: "Tunç", email: "asli@medyatr.com", company: "Medya TR Dijital", status: "CUSTOMER", source: "WEBSITE", totalSpent: 14999.99, orderCount: 1, tenantId: tenant2.id },
    })
    await prisma.customer.create({
        data: { firstName: "Onur", lastName: "Kılıç", email: "onur@kilicavm.com", company: "Kılıç AVM Yönetimi", status: "LEAD", source: "SOCIAL_MEDIA", leadScore: 40, tenantId: tenant2.id },
    })

    // ── Sipariş (Tenant 2) ──────────────────────────────────────────────
    const cust2 = await prisma.customer.findFirstOrThrow({ where: { tenantId: tenant2.id, status: "CUSTOMER" } })
    await prisma.order.create({
        data: {
            orderNumber: "INV-SIP-001", status: "COMPLETED",
            subtotal: 14999.99, total: 14999.99, currency: "TRY",
            paymentStatus: "paid", paidAt: new Date("2025-02-15"),
            customerId: cust2.id, tenantId: tenant2.id,
            items: { create: [{ productName: "Web Sitesi Paketi (Kurumsal)", productSku: "WEB-PCK-001", quantity: 1, unitPrice: 14999.99, total: 14999.99 }] },
        },
    })

    // ── İşlemler (Tenant 2) ─────────────────────────────────────────────
    await prisma.transaction.createMany({
        data: [
            { type: "INCOME", amount: 14999.99, description: "Medya TR — Web sitesi ödemesi", category: "Proje Geliri", date: new Date("2025-02-15"), tenantId: tenant2.id },
            { type: "EXPENSE", amount: 5000, description: "Ofis kirası — Mart 2025", category: "Kira", date: new Date("2025-03-01"), tenantId: tenant2.id },
            { type: "EXPENSE", amount: 3500, description: "Bulut sunucu faturası", category: "BT", date: new Date("2025-02-20"), tenantId: tenant2.id },
        ],
    })

    // ====================================================================
    //  SUMMARY / ÖZET
    // ====================================================================
    console.log("\n═══════════════════════════════════════════")
    console.log("🎉 Tohumlama başarıyla tamamlandı!")
    console.log("═══════════════════════════════════════════\n")

    console.log("📧 Giriş Bilgileri:\n")
    console.log("  ┌─ Tenant 1: Deftra Teknoloji A.Ş. (PROFESSIONAL) ───────────┐")
    console.log(`  │  admin@deftra.com      │ admin123    │ ADMIN / CEO       │`)
    console.log(`  │  manager@deftra.com    │ manager123  │ MANAGER / Satış D.│`)
    console.log(`  │  viewer@deftra.com     │ user123     │ VIEWER            │`)
    console.log("  └────────────────────────────────────────────────────────────┘\n")
    console.log("  ┌─ Tenant 2: İnovasyon Yazılım Ltd. Şti. (STARTER) ────────┐")
    console.log(`  │  admin@inovasyon.com.tr  │ startup123  │ ADMIN             │`)
    console.log(`  │  user@inovasyon.com.tr   │ user123     │ USER              │`)
    console.log("  └────────────────────────────────────────────────────────────┘\n")

    const counts = {
        tenant: "2",
        kullanıcı: "8",
        para_birimi: "6",
        döviz_kuru: "15",
        vergi_türü: "14",
        enflasyon_katsayısı: "15",
        masraf_merkezi: "7",
        banka_hesabı: "8",
        kategori: "8",
        tedarikçi: "6",
        ürün: "19",
        departman: "9",
        çalışan: "13",
        müşteri: "10",
        etkileşim: "9",
        sipariş: "6",
        işlem: "17",
        izin_talebi: "7",
        cari_hesap: "8",
        e_fatura: "4",
        çek_senet: "4",
        muhasebe_kaydı: "6",
        ba_bs_formu: "2",
        aktivite_logu: "6",
    }
    console.log("📊 Veri Özeti:")
    for (const [key, val] of Object.entries(counts)) {
        console.log(`  ${key.padEnd(20)} ${val}`)
    }
    console.log()
}

main()
    .catch((e) => {
        console.error("❌ Tohumlama başarısız:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
