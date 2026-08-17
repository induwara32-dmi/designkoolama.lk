export type QuoteSubmission = { fullName: string; email: string; phone: string; company?: string; deadline: string; preferredContact: "WhatsApp" | "Phone" | "Email"; service: string; budget?: string; projectDetails: string; attachment?: FileList };

export interface QuoteSubmissionService { submit(payload: QuoteSubmission): Promise<void>; }

export const quoteSubmissionService: QuoteSubmissionService = {
  async submit() { throw new Error("Quote submissions will be enabled when the public API is available."); },
};
