import Link from "next/link";
export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="admin-auth"><section className="admin-auth-card"><Link className="admin-brand" href="/">DesignKoolama<span>•</span></Link><p className="admin-eyebrow">Secure administration</p><h1>{title}</h1><p className="admin-copy">{description}</p>{children}</section></div>;
}
