"use client"

import * as React from "react"
import { toast } from "sonner"
import { updatePermissions } from "@/lib/actions/users"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const MODULES = [
    { id: "inventory", name: "Stok & Ürün" },
    { id: "finance", name: "Finans & Satış" },
    { id: "hr", name: "İnsan Kaynakları" },
    { id: "crm", name: "Müşteri İlişkileri" },
    { id: "reports", name: "Raporlar & Analiz" },
]

type UserWithPerms = {
    id: string
    name: string | null
    email: string
    role: string
    permissions: string[]
}

export function PermissionsClient({ users }: { users: UserWithPerms[] }) {
    const [savingId, setSavingId] = React.useState<string | null>(null)
    const [localUsers, setLocalUsers] = React.useState(users)

    const togglePermission = (userId: string, permission: string) => {
        setLocalUsers(prev => prev.map(u => {
            if (u.id !== userId) return u
            const perms = new Set(u.permissions)
            if (perms.has(permission)) {
                perms.delete(permission)
            } else {
                perms.add(permission)
            }
            return { ...u, permissions: Array.from(perms) }
        }))
    }

    const handleSave = async (userId: string) => {
        setSavingId(userId)
        try {
            const user = localUsers.find(u => u.id === userId)
            if (!user) return
            
            const result = await updatePermissions({ id: userId, permissions: user.permissions })
            if (!result.ok) throw new Error(result.error)
            
            toast.success("Yetkiler başarıyla güncellendi.")
        } catch (_error) {
            toast.error("Yetkiler güncellenirken bir hata oluştu.")
        } finally {
            setSavingId(null)
        }
    }

    return (
        <div className="rounded-xl border bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Rol</TableHead>
                        {MODULES.map(m => (
                            <TableHead key={m.id} className="text-center">{m.name}</TableHead>
                        ))}
                        <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {localUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                {user.name || "İsimsiz"}
                                <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            {MODULES.map(m => {
                                const permKey = `${m.id}:read`
                                const isAdmin = user.role === "ADMIN"
                                const hasPerm = isAdmin || user.permissions.includes(permKey)
                                
                                return (
                                    <TableCell key={m.id} className="text-center">
                                        <Checkbox 
                                            checked={hasPerm}
                                            disabled={isAdmin}
                                            onCheckedChange={() => togglePermission(user.id, permKey)}
                                        />
                                    </TableCell>
                                )
                            })}
                            <TableCell className="text-right">
                                <Button 
                                    size="sm" 
                                    disabled={user.role === "ADMIN" || savingId === user.id}
                                    onClick={() => handleSave(user.id)}
                                >
                                    {savingId === user.id ? "Kaydediliyor..." : "Kaydet"}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
