import {apiRequest} from "./api-client";
export type ContactSubmission = { fullName:string; email:string; phone:string; subject:string; message:string };
export interface ContactSubmissionService { submit(payload: ContactSubmission): Promise<void>; }
export const contactSubmissionService: ContactSubmissionService = { async submit(payload){await apiRequest("/contact",{method:"POST",body:JSON.stringify({...payload,website:""})})} };
