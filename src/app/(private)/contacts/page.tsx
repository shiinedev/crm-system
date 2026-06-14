import { ContactsTable } from "@/modules/contacts/components/contacts-table"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Contacts" }

export default function ContactsPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="border-b px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">Contacts</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your contact relationships</p>
            </div>
            <div className="flex-1 overflow-hidden">
                <ContactsTable />
            </div>
        </div>
    )
}