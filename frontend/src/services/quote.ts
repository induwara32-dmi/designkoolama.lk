import {apiRequest} from "./api-client";
export type QuoteSubmission = { fullName: string; email: string; phone: string; company?: string; deadline: string; preferredContact: "WhatsApp" | "Phone" | "Email"; service: string; selectedPackage?:string; budget?: string; projectDetails: string; attachment?: FileList; website?: string };

export interface QuoteSubmissionService { submit(payload: QuoteSubmission): Promise<void>; }

export const quoteSubmissionService: QuoteSubmissionService = {
  // `website` is the honeypot: forwarded as-is (defaulting to "" only when the field
  // never rendered) so the backend's spam check actually sees whatever a bot filled in,
  // instead of this call silently overwriting it back to empty every time.
  async submit(payload) { const data={...payload};delete data.attachment;await apiRequest("/quotes",{method:"POST",body:JSON.stringify({...data,website:payload.website??""})}); },
};
