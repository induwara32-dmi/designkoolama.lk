import { AuthShell } from "@/components/admin/auth-shell"; import { ForgotForm } from "@/components/admin/auth-forms";
export default function Page(){return <AuthShell title="Reset your password" description="Enter your account email. The response is intentionally the same for every address."><ForgotForm/></AuthShell>}
