import {apiRequest} from "./api-client";
export type ContactSubmission = { fullName:string; email:string; phone:string; subject:string; message:string; website?: string };
export interface ContactSubmissionService { submit(payload: ContactSubmission): Promise<void>; }
// `website` is the honeypot: forwarded as-is so the backend's spam check actually sees
// whatever a bot filled in, instead of this call silently overwriting it back to empty.
export const contactSubmissionService: ContactSubmissionService = { async submit(payload){await apiRequest("/contact",{method:"POST",body:JSON.stringify({...payload,website:payload.website??""})})} };
