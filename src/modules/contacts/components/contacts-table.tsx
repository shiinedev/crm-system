"use client"

import { useState } from "react"
import { MoreHorizontal, Plus, Search, Users, Pencil, Trash2, X, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ContactFormDialog } from "./contact-form-dialog"
import { useDeleteContact } from "../hooks/use-contact-mutations"
import { useFilters } from "@/hooks/use-filters"
import { getInitials } from "@/utils/get-initials"
import { formatRelativeTime } from "@/utils/format-date"
import type { Contact } from "@/db/schema"
import { useTRPC } from "@/lib/trpc/client"
import { useQuery } from "@tanstack/react-query"
import { ContactsTableSkeleton } from "./contacts-skeleton"

const STATUS_COLORS: Record<string, "default" | "success" | "destructive" | "warning" | "outline"> = {
    active: "success",
    inactive: "outline",
    bounced: "destructive",
}

export function ContactsTable() {
    const [formOpen, setFormOpen] = useState(false)
    const [editContact, setEditContact] = useState<Contact | undefined>()

    const { q, setFilter, contactStatus, hasActiveFilters, resetFilters } = useFilters()

    const trpc = useTRPC();

    const { data: contacts = [], isLoading } = useQuery(trpc.contacts.list.queryOptions())
    const { execute: deleteContact } = useDeleteContact()

    const filtered = contacts.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase()
        const matchesQ = !q ||
            fullName.includes(q.toLowerCase()) ||
            c.email?.toLowerCase().includes(q.toLowerCase()) ||
            c.title?.toLowerCase().includes(q.toLowerCase())
        const matchesStatus = !contactStatus || c.status === contactStatus
        return matchesQ && matchesStatus
    })

    function handleEdit(contact: Contact) {
        setEditContact(contact)
        setFormOpen(true)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-8 h-8 text-sm"
                            value={q}
                            onChange={(e) => setFilter("q", e.target.value)}
                        />
                    </div>
                    <Select
                        value={contactStatus || "all"}
                        onValueChange={(v) => setFilter("contactStatus", v === "all" ? null : v as any)}
                    >
                        <SelectTrigger className="h-8 w-32 text-sm">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {["active", "inactive", "bounced"].map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground" onClick={resetFilters}>
                            <X className="h-3.5 w-3.5" />Clear
                        </Button>
                    )}
                </div>
                <Button size="sm" onClick={() => { setEditContact(undefined); setFormOpen(true) }}>
                    <Plus className="h-4 w-4" />Add contact
                </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <ContactsTableSkeleton />
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            {hasActiveFilters ? "No contacts match your filters" : "No contacts yet"}
                        </p>
                        {!hasActiveFilters && (
                            <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
                                Add your first contact
                            </Button>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Name</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Contact</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Title</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Last seen</th>
                                <th className="w-10 px-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((contact) => (
                                <tr key={contact.id} className="border-b hover:bg-muted/20 transition-colors group">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={contact.avatar ?? undefined} />
                                                <AvatarFallback className="text-[10px]">
                                                    {getInitials(`${contact.firstName} ${contact.lastName}`)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-0.5">
                                            {contact.email && (
                                                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                                    <Mail className="h-2.5 w-2.5" />{contact.email}
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                                    <Phone className="h-2.5 w-2.5" />{contact.phone}
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {contact.title ?? "—"}
                                        {contact.department && <span className="text-xs"> · {contact.department}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {contact.status ? (
                                            <Badge variant={STATUS_COLORS[contact.status] ?? "outline"} className="capitalize">
                                                {contact.status}
                                            </Badge>
                                        ) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        {formatRelativeTime(contact.lastInteractionAt ?? contact.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                                    <Pencil className="h-4 w-4" />Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => deleteContact({ id: contact.id })}
                                                >
                                                    <Trash2 className="h-4 w-4" />Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ContactFormDialog open={formOpen} onOpenChange={setFormOpen} contact={editContact} />
        </div>
    )
}