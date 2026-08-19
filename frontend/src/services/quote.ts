import {apiRequest} from "./api-client";
export type QuoteSubmission = { fullName: string; email: string; phone: string; company?: string; deadline: string; preferredContact: "WhatsApp" | "Phone" | "Email"; service: string; selectedPackage?:string; budget?: string; projectDetails: string; attachment?: FileList };

export interface QuoteSubmissionService { submit(payload: QuoteSubmission): Promise<void>; }

export const quoteSubmissionService: QuoteSubmissionService = {
  async submit(payload) { const data={...payload};delete data.attachment;await apiRequest("/quotes",{method:"POST",body:JSON.stringify({...data,website:""})}); },
};
