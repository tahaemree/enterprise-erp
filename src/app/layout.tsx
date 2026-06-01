import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: {
        template: "%s | Deftra ERP",
        default: "Deftra ERP — Enterprise Resource Planning System",
    },
    description:
        "A comprehensive, modular, and scalable SaaS ERP system with e-Invoice, inventory, CRM, and accounting.",
    keywords: ["ERP", "Enterprise", "Business Management", "SaaS", "e-Fatura", "e-Invoice"],
    applicationName: "Deftra ERP",
    authors: [{ name: "Deftra" }],
    generator: "Next.js",
    referrer: "origin-when-cross-origin",
    creator: "Deftra",
    publisher: "Deftra",
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        type: "website",
        locale: "en_US",
        siteName: "Deftra ERP",
        title: "Deftra ERP — Enterprise Resource Planning System",
        description:
            "Comprehensive SaaS ERP with e-Invoice, inventory, CRM, and accounting modules.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Deftra ERP — Enterprise Resource Planning",
        description:
            "Comprehensive SaaS ERP system with e-Invoice, inventory, CRM, and accounting.",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            name: "Deftra ERP",
                            applicationCategory: "BusinessApplication",
                            operatingSystem: "Web",
                            description:
                                "A comprehensive, modular, and scalable SaaS ERP system with e-Invoice, inventory, CRM, and accounting modules.",
                            offers: {
                                "@type": "Offer",
                                price: "0",
                                priceCurrency: "TRY",
                            },
                            author: {
                                "@type": "Organization",
                                name: "Deftra",
                            },
                        }),
                    }}
                />
            </head>
            <body className={`${inter.variable} font-sans antialiased`}>
                {children}
            </body>
        </html>
    )
}
