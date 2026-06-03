import { PrismaClient, OrderStatus } from "@prisma/client"

const prisma = new PrismaClient()

async function runTest() {
    console.log("🚀 Starting E2E Test Simulation...")

    try {
        // 1. Create a Test Tenant
        console.log("✅ 1. Setting up Test Tenant...")
        const tenantSlug = `test-tenant-${Date.now()}`
        const tenant = await prisma.tenant.create({
            data: {
                name: "E2E Test Tenant",
                slug: tenantSlug,
                taxId: "1112223334",
            }
        })
        const tenantId = tenant.id

        // 2. Create a Product
        console.log("✅ 2. Creating Product...")
        const product = await prisma.product.create({
            data: {
                tenantId,
                name: "Test Product A",
                sku: "SKU-TP-A",
                price: 100,
                quantity: 50,
                minStock: 5,
            }
        })

        // 3. Create a Customer
        console.log("✅ 3. Creating Customer...")
        const customer = await prisma.customer.create({
            data: {
                tenantId,
                firstName: "Ali",
                lastName: "Veli",
                email: "ali@test.com",
            }
        })

        // 4. Create an Order (Using the logic that OrderService would use)
        console.log("✅ 4. Creating Order & Deducting Stock...")
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    tenantId,
                    customerId: customer.id,
                    orderNumber: `ORD-${Date.now()}`,
                    status: OrderStatus.CONFIRMED,
                    subtotal: 200,
                    taxAmount: 0,
                    total: 200, // 2 items * 100
                    items: {
                        create: [
                            {
                                productId: product.id,
                                productName: product.name,
                                productSku: product.sku,
                                quantity: 2,
                                unitPrice: 100,
                                total: 200
                            }
                        ]
                    }
                },
                include: { items: true }
            })

            // Deduct stock
            await tx.product.update({
                where: { id: product.id },
                data: { quantity: { decrement: 2 } }
            })

            return newOrder
        })

        // Verify Stock
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } })
        if (updatedProduct?.quantity?.toNumber() !== 48) {
            throw new Error(`Stock deduction failed! Expected 48, got ${updatedProduct?.quantity}`)
        }
        console.log("   Stock verified correctly.")

        // 5. Cancel Order (Restore Stock)
        console.log("✅ 5. Cancelling Order & Restoring Stock...")
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.CANCELLED }
            })

            await tx.product.update({
                where: { id: product.id },
                data: { quantity: { increment: 2 } }
            })
        })

        const restoredProduct = await prisma.product.findUnique({ where: { id: product.id } })
        if (restoredProduct?.quantity?.toNumber() !== 50) {
            throw new Error(`Stock restoration failed! Expected 50, got ${restoredProduct?.quantity}`)
        }
        console.log("   Stock restored correctly.")

        // 6. Finance: Create Account Entry
        console.log("✅ 6. Creating Account Entry...")
        const _entryCount = await prisma.accountEntry.count({ where: { tenantId } })
        const _entry = await prisma.accountEntry.create({
            data: {
                tenantId,
                entryNumber: `F-TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                entryType: "DEBIT_NOTE",
                description: "Test Fatura",
                entryDate: new Date(),
                lines: {
                    create: [
                        { side: "DEBIT", amount: 200, description: "Alacak" },
                        { side: "CREDIT", amount: 200, description: "Satış Geliri" }
                    ]
                }
            }
        })

        // Cleanup
        console.log("✅ 7. Cleaning up test data...")
        await prisma.tenant.delete({ where: { id: tenant.id } })

        console.log("🎉 E2E Test Completed Successfully!")
    } catch (error) {
        console.error("❌ E2E Test Failed:", error)
        process.exit(1)
    }
}

runTest()
