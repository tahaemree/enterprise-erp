import { AppShell } from "@/components/layout/app-shell"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { Providers } from "@/components/providers"
import { auth } from "@/lib/auth"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    return (
        <Providers session={session}>
            <AppShell>
                <Breadcrumbs />
                {children}
            </AppShell>
        </Providers>
    )
}
