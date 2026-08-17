export type ContactSubmission = { fullName:string; email:string; phone:string; subject:string; message:string };
export interface ContactSubmissionService { submit(payload: ContactSubmission): Promise<void>; }
export const contactSubmissionService: ContactSubmissionService = { async submit(){ throw new Error("Contact submissions will be enabled when the public API is available."); } };
