import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Dashboard routes to index
  const routes = [
    '',
    '/dashboard',
    '/inventory/products',
    '/inventory/categories',
    '/inventory/suppliers',
    '/finance/orders',
    '/finance/invoices',
    '/finance/transactions',
    '/hr/employees',
    '/hr/departments',
    '/crm/customers',
    '/accounting/e-invoice',
  ]

  const locales = ['tr', 'en']
  const sitemapData: MetadataRoute.Sitemap = []

  for (const route of routes) {
    sitemapData.push({
      url: `${baseUrl}/tr${route}`, // Default TR
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: {
          tr: `${baseUrl}/tr${route}`,
          en: `${baseUrl}/en${route}`,
        },
      },
    })
  }

  return sitemapData
}
