"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Textarea } from "@/components/ui/textarea"
import {
    Settings,
    Shield,
    Bell,
    Save,
    Loader2,
    Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { Separator } from "@/components/ui/separator"
import { useTheme } from "@teispace/next-themes"
import { toast } from "sonner"
import { updateProfile } from "@/lib/actions/users"

export default function SettingsPage() {
    const t = useTranslations('settings')
    const { theme, setTheme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [companyName, setCompanyName] = useState("Deftra Inc.")
    const [taxOffice, setTaxOffice] = useState("")
    const [taxNumber, setTaxNumber] = useState("")
    const [address, setAddress] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const handleSave = async () => {
        if (!name.trim() || !email.trim()) {
            toast.error(t('profileRequired'))
            return
        }
        if (newPassword && newPassword !== confirmPassword) {
            toast.error(t('passwordMismatch'))
            return
        }
        setIsSaving(true)
        try {
            const result = await updateProfile({
                name: name.trim(),
                email: email.trim(),
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
            })
            if (result.ok) {
                toast.success(t('saveSuccess'))
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(result.error || t('error'))
            }
        } catch {
            toast.error(t('error'))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-7 w-7 text-muted-foreground" />
                    {t('title')}
                </h1>
                <p className="text-muted-foreground">
                    {t('description')}
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="inline-flex h-auto flex-wrap gap-2 bg-transparent p-0">
                    <TabsTrigger
                        value="general"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                        <Settings className="h-4 w-4" />
                        {t('general')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                        <Shield className="h-4 w-4" />
                        {t('security')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="flex items-center gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                        <Bell className="h-4 w-4" />
                        {t('notifications')}
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    {/* Profile Information */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Settings className="h-5 w-5 text-muted-foreground" />
                                {t('profileInfo.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('profileInfo.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">{t('profileInfo.name')}</Label>
                                    <Input id="name" placeholder={t('profileInfo.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('profileInfo.email')}</Label>
                                    <Input id="email" type="email" placeholder={t('profileInfo.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Monitor className="h-5 w-5 text-muted-foreground" />
                                {t('companyInfo.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('companyInfo.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">{t('companyInfo.companyName')}</Label>
                                <Input id="companyName" placeholder={t('companyInfo.companyNamePlaceholder')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="taxOffice">{t('companyInfo.taxOffice')}</Label>
                                    <Input id="taxOffice" placeholder={t('companyInfo.taxOfficePlaceholder')} value={taxOffice} onChange={(e) => setTaxOffice(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxNumber">{t('companyInfo.taxNumber')}</Label>
                                    <Input id="taxNumber" placeholder={t('companyInfo.taxNumberPlaceholder')} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('companyInfo.address')}</Label>
                                <Textarea id="address" placeholder={t('companyInfo.addressPlaceholder')} value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>



                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                {t('password.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('password.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">{t('password.currentPassword')}</Label>
                                    <Input id="currentPassword" type="password" placeholder={t('password.currentPasswordPlaceholder')} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">{t('password.newPassword')}</Label>
                                    <Input id="newPassword" type="password" placeholder={t('password.newPasswordPlaceholder')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">{t('password.confirmPassword')}</Label>
                                    <Input id="confirmPassword" type="password" placeholder={t('password.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                {t('session.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('session.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('session.twoFactor')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('session.twoFactorDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={false} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('session.sessionTimeout')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('session.sessionTimeoutDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('session.loginNotifications')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('session.loginNotifDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {t('notificationPrefs.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('notificationPrefs.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('notificationPrefs.emailNotifications')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notificationPrefs.emailNotifDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('notificationPrefs.invoiceUpdates')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notificationPrefs.invoiceUpdatesDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('notificationPrefs.orderAlerts')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notificationPrefs.orderAlertsDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('notificationPrefs.lowStockWarnings')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notificationPrefs.lowStockWarningsDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={true} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('notificationPrefs.systemUpdates')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('notificationPrefs.systemUpdatesDesc')}
                                    </p>
                                </div>
                                <Switch defaultChecked={false} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">
                    {t('changesApplied')}
                </p>
                <Button onClick={handleSave} disabled={isSaving} size="lg">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? t('saving') : t('saveButton')}
                </Button>
            </div>
        </div>
    )
}
