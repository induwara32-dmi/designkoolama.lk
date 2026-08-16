import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BaseProps = { label: string; error?: string; optional?: boolean };

export const FormInput = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(function FormInput({ label, error, optional, className, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return <div><label className="form-label" htmlFor={inputId}>{label}{optional && <span className="text-muted"> (Optional)</span>}</label><input ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={cn("form-control", className)} {...props}/>{error && <p id={`${inputId}-error`} className="form-error">{error}</p>}</div>;
});

export const FormTextarea = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function FormTextarea({ label, error, className, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return <div><label className="form-label" htmlFor={inputId}>{label}</label><textarea ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} className={cn("form-control min-h-36 resize-y", className)} {...props}/>{error && <p id={`${inputId}-error`} className="form-error">{error}</p>}</div>;
});

export const FormSelect = forwardRef<HTMLSelectElement, BaseProps & SelectHTMLAttributes<HTMLSelectElement>>(function FormSelect({ label, error, children, id, ...props }, ref) {
  const inputId = id ?? props.name;
  return <div><label className="form-label" htmlFor={inputId}>{label}</label><select ref={ref} id={inputId} aria-invalid={Boolean(error)} className="form-control" {...props}>{children}</select>{error && <p className="form-error">{error}</p>}</div>;
});
