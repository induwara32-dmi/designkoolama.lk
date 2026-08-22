import { Suspense } from "react"; import { AuthShell } from "@/components/admin/auth-shell"; import { ResetForm } from "@/components/admin/auth-forms";
export default function Page(){return <AuthShell title="Choose a new password" description="Reset links expire and can only be used once."><Suspense fallback={<p>Loading…</p>}><ResetForm/></Suspense></AuthShell>}
