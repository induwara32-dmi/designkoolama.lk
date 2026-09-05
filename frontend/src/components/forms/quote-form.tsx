"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ErrorMessage,
  LoadingIndicator,
  SuccessMessage,
} from "@/components/feedback/states";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { quoteSubmissionService } from "@/services/quote";
import { buildWhatsAppLink, joinWhatsAppMessage } from "@/lib/whatsapp";
import { services as staticServices, type ServiceContent } from "@/content/services";
import { loadServices } from "@/services/public-content";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  company: z.string().trim().optional(),
  deadline: z.string().min(1, "Choose a project deadline"),
  preferredContact: z.enum(["WhatsApp", "Phone", "Email"]),
  service: z.string().min(1, "Choose a service"),
  selectedPackage: z.string().optional(),
  budget: z.string().optional(),
  projectDetails: z
    .string()
    .trim()
    .min(20, "Tell us a little more about your project"),
  // Honeypot: invisible to real visitors, so it must stay empty. A bot that fills in
  // every field on the page will trip it, and the backend rejects a non-empty value.
  website: z.string().max(0).optional(),
  attachment: z
    .custom<FileList>()
    .optional()
    .refine(
      (files) => !files?.length || files[0].size <= 10 * 1024 * 1024,
      "File must be 10 MB or smaller",
    )
    .refine(
      (files) =>
        !files?.length ||
        ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(
          files[0].type,
        ),
      "Use PNG, JPG, WEBP, or PDF",
    ),
});
type FormValues = z.infer<typeof schema>;

function buildQuoteWhatsAppMessage(values: FormValues) {
  return joinWhatsAppMessage([
    "Hi, I'd like to request a quote.",
    `Name: ${values.fullName}`,
    `Email: ${values.email}`,
    `WhatsApp: ${values.phone}`,
    `Preferred contact: ${values.preferredContact}`,
    values.company?.trim() && `Company: ${values.company.trim()}`,
    `Service: ${values.service}`,
    values.budget?.trim() && `Budget: ${values.budget.trim()}`,
    `Deadline: ${values.deadline}`,
    `Project details: ${values.projectDetails}`,
  ]);
}

export function QuoteForm({
  includeAttachment = false,
  initialService = "",
  initialPackage = "",
}: {
  includeAttachment?: boolean;
  initialService?: string;
  initialPackage?: string;
}) {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  // Starts from the static list so the dropdown is never empty, then upgrades to live
  // service data once it loads -- so a service created after the last deploy is selectable
  // here too, not just the 6 originally-seeded ones.
  const [serviceOptions, setServiceOptions] = useState<readonly ServiceContent[]>(staticServices);
  useEffect(() => {
    let active = true;
    loadServices()
      .then((items) => { if (active && items.length) setServiceOptions(items); })
      .catch(() => { /* keep the static list on failure */ });
    return () => { active = false; };
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      preferredContact: "WhatsApp",
      service: initialService,
      selectedPackage: initialPackage,
      projectDetails: initialPackage
        ? `I am interested in the ${initialPackage} package. `
        : "",
    },
  });
  useEffect(() => {
    setValue("service", initialService);
    setValue("selectedPackage", initialPackage);
    if (initialPackage) setValue("projectDetails", `I am interested in the ${initialPackage} package. `);
  }, [initialPackage, initialService, setValue]);
  const onSubmit = async (values: FormValues) => {
    setServerError("");
    setSuccess(false);
    // Opened synchronously (before the await below) so it stays tied to this click and
    // isn't blocked as a popup; it's redirected to the WhatsApp link once the save succeeds.
    const whatsappTab = window.open("", "_blank");
    try {
      await quoteSubmissionService.submit({
        ...values,
        selectedPackage: initialPackage || undefined,
      });
      const link = buildWhatsAppLink(buildQuoteWhatsAppMessage(values));
      if (whatsappTab) whatsappTab.location.href = link;
      else window.open(link, "_blank", "noopener,noreferrer");
      setSuccess(true);
      reset();
    } catch (error) {
      whatsappTab?.close();
      setServerError(
        error instanceof Error
          ? error.message
          : "We could not submit your request.",
      );
    }
  };
  return (
    <form className="quote-card" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="quote-website">Leave this field blank</label>
        <input id="quote-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FormInput
          label="Full Name"
          id="quote-fullName"
          placeholder="John Doe"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormInput
          label="Email Address"
          id="quote-email"
          type="email"
          placeholder="john@company.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <FormInput
          label="WhatsApp Number"
          id="quote-phone"
          type="tel"
          placeholder="+94 77 123 4567"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <FormInput
          label="Project Deadline"
          id="quote-deadline"
          type="date"
          error={errors.deadline?.message}
          {...register("deadline")}
        />
        <FormInput
          label="Company Name"
          id="quote-company"
          optional
          placeholder="Your Company Ltd."
          error={errors.company?.message}
          {...register("company")}
        />
        <FormSelect
          label="Preferred Contact"
          id="quote-preferredContact"
          error={errors.preferredContact?.message}
          {...register("preferredContact")}
        >
          <option>WhatsApp</option>
          <option>Phone</option>
          <option>Email</option>
        </FormSelect>
        <FormSelect
          label="Service Required"
          id="quote-service"
          error={errors.service?.message}
          {...register("service")}
        >
          <option value="">Select a service</option>
          {serviceOptions.map((item) => (
            <option key={item.slug} value={item.name}>{item.name}</option>
          ))}
        </FormSelect>
        <FormSelect
          label="Budget"
          id="quote-budget"
          error={errors.budget?.message}
          {...register("budget")}
        >
          <option value="">Select a range (optional)</option>
          <option>Under LKR 50,000</option>
          <option>LKR 50,000 – 150,000</option>
          <option>LKR 150,000+</option>
        </FormSelect>
      </div>
      <div className="mt-6">
        <FormTextarea
          label="Project Details"
          id="quote-projectDetails"
          placeholder="Tell us about your project..."
          error={errors.projectDetails?.message}
          {...register("projectDetails")}
        />
      </div>
      {includeAttachment && (
        <div className="mt-6">
          <FormInput
            label="Project Attachment"
            id="quote-attachment"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            error={errors.attachment?.message}
            {...register("attachment")}
          />
        </div>
      )}
      {serverError && (
        <div className="mt-5">
          <ErrorMessage message={serverError} />
        </div>
      )}
      {success && (
        <div className="mt-5">
          <SuccessMessage message="Thanks! We've received your request — continue the conversation on WhatsApp." />
        </div>
      )}
      <Button
        className="mt-7 w-full rounded-lg py-4 text-sm uppercase tracking-[.16em]"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <LoadingIndicator label="Submitting" />
        ) : (
          "Submit Request"
        )}
      </Button>
    </form>
  );
}
