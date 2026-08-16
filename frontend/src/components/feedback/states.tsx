import { AlertCircle, CheckCircle2, LoaderCircle, SearchX } from "lucide-react";

export function LoadingIndicator({ label = "Loading" }: { label?: string }) { return <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" aria-hidden="true"/>{label}</span>; }
export function ErrorMessage({ message }: { message: string }) { return <p className="flex items-center gap-2 text-sm text-red-400" role="alert"><AlertCircle className="size-4"/>{message}</p>; }
export function SuccessMessage({ message }: { message: string }) { return <p className="flex items-center gap-2 text-sm text-green-400" role="status"><CheckCircle2 className="size-4"/>{message}</p>; }
export function EmptyState({ title = "Nothing to show yet" }: { title?: string }) { return <div className="glass-card grid min-h-48 place-items-center p-8 text-center text-muted"><div><SearchX className="mx-auto mb-3 size-7"/><p>{title}</p></div></div>; }
