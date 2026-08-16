"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorMessage, LoadingIndicator, SuccessMessage } from "@/components/feedback/states";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { quoteSubmissionService } from "@/services/quote";

const schema = z.object({ fullName: z.string().trim().min(2, "Enter your full name"), email: z.email("Enter a valid email address"), phone: z.string().trim().min(7, "Enter a valid phone number"), company: z.string().trim().optional(), deadline: z.string().min(1, "Choose a project deadline"), preferredContact: z.enum(["WhatsApp", "Phone", "Email"]), service: z.string().min(1, "Choose a service"), budget: z.string().optional(), projectDetails: z.string().trim().min(20, "Tell us a little more about your project") });
type FormValues = z.infer<typeof schema>;

export function QuoteForm() {
  const [serverError, setServerError] = useState(""); const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { preferredContact: "WhatsApp" } });
  const onSubmit = async (values: FormValues) => { setServerError(""); setSuccess(false); try { await quoteSubmissionService.submit(values); setSuccess(true); reset(); } catch (error) { setServerError(error instanceof Error ? error.message : "We could not submit your request."); } };
  return <form className="quote-card" noValidate onSubmit={handleSubmit(onSubmit)}><div className="grid gap-6 md:grid-cols-2"><FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message} {...register("fullName")}/><FormInput label="Email Address" type="email" placeholder="john@company.com" error={errors.email?.message} {...register("email")}/><FormInput label="WhatsApp Number" type="tel" placeholder="+94 77 123 4567" error={errors.phone?.message} {...register("phone")}/><FormInput label="Project Deadline" type="date" error={errors.deadline?.message} {...register("deadline")}/><FormInput label="Company Name" optional placeholder="Your Company Ltd." error={errors.company?.message} {...register("company")}/><FormSelect label="Preferred Contact" error={errors.preferredContact?.message} {...register("preferredContact")}><option>WhatsApp</option><option>Phone</option><option>Email</option></FormSelect><FormSelect label="Service Required" error={errors.service?.message} {...register("service")}><option value="">Select a service</option><option>Branding & Identity</option><option>Print Advertising</option><option>Social Media Design</option><option>Packaging Design</option><option>Merchandise Design</option><option>3D Design</option></FormSelect><FormSelect label="Budget" error={errors.budget?.message} {...register("budget")}><option value="">Select a range (optional)</option><option>Under LKR 50,000</option><option>LKR 50,000 – 150,000</option><option>LKR 150,000+</option></FormSelect></div><div className="mt-6"><FormTextarea label="Project Details" placeholder="Tell us about your project..." error={errors.projectDetails?.message} {...register("projectDetails")}/></div>{serverError && <div className="mt-5"><ErrorMessage message={serverError}/></div>}{success && <div className="mt-5"><SuccessMessage message="Your request has been submitted."/></div>}<Button className="mt-7 w-full rounded-lg py-4 text-sm uppercase tracking-[.16em]" disabled={isSubmitting} type="submit">{isSubmitting ? <LoadingIndicator label="Submitting"/> : "Submit Request"}</Button></form>;
}
