import { redirect } from "@/i18n/navigation"

type Props = {
    params: Promise<{ locale: string }>
}

export default async function HrRedirectPage({ params }: Props) {
    const { locale } = await params
    redirect({ href: "/hr/employees", locale })
}
