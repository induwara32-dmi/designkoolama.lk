"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {ErrorMessage,LoadingIndicator,SuccessMessage} from "@/components/feedback/states";
import {FormInput,FormTextarea} from "@/components/forms/fields";
import {Button} from "@/components/ui/button";
import {contactSubmissionService} from "@/services/contact";
import {buildWhatsAppLink,joinWhatsAppMessage} from "@/lib/whatsapp";
// "website" is a honeypot: invisible to real visitors, so it must stay empty. A bot
// that fills in every field on the page will trip it, and the backend rejects a
// non-empty value.
const schema=z.object({fullName:z.string().trim().min(2,"Enter your full name"),email:z.email("Enter a valid email address"),phone:z.string().trim().min(7,"Enter a valid phone number"),subject:z.string().trim().min(3,"Enter a subject"),message:z.string().trim().min(20,"Tell us a little more"),website:z.string().max(0).optional()});
type Values=z.infer<typeof schema>;
function buildContactWhatsAppMessage(values:Values){
 return joinWhatsAppMessage(["Hi, I have a message for your team.",`Name: ${values.fullName}`,`Email: ${values.email}`,`Phone: ${values.phone}`,`Subject: ${values.subject}`,`Message: ${values.message}`]);
}
export function ContactForm(){
 const [feedback,setFeedback]=useState("");const [success,setSuccess]=useState(false);
 const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm<Values>({resolver:zodResolver(schema)});
 const submit=async(values:Values)=>{
  setFeedback("");setSuccess(false);
  // Opened synchronously (before the await below) so it stays tied to this click and isn't
  // blocked as a popup; it's redirected to the WhatsApp link once the save succeeds.
  const whatsappTab=window.open("","_blank");
  try{
   await contactSubmissionService.submit(values);
   const link=buildWhatsAppLink(buildContactWhatsAppMessage(values));
   if(whatsappTab)whatsappTab.location.href=link;else window.open(link,"_blank","noopener,noreferrer");
   setSuccess(true);reset();
  }catch(error){
   whatsappTab?.close();
   setFeedback(error instanceof Error?error.message:"Unable to send your message.");
  }
 };
 return <form className="quote-card" noValidate onSubmit={handleSubmit(submit)}><div className="hp-field" aria-hidden="true"><label htmlFor="contact-website">Leave this field blank</label><input id="contact-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")}/></div><div className="grid gap-6 md:grid-cols-2"><FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message}{...register("fullName")}/><FormInput label="Email Address" type="email" placeholder="john@company.com" error={errors.email?.message}{...register("email")}/><FormInput label="Phone Number" type="tel" placeholder="+94 77 123 4567" error={errors.phone?.message}{...register("phone")}/><FormInput label="Subject" placeholder="How can we help?" error={errors.subject?.message}{...register("subject")}/></div><div className="mt-6"><FormTextarea label="Message" placeholder="Tell us about your project..." error={errors.message?.message}{...register("message")}/></div>{feedback&&<div className="mt-5"><ErrorMessage message={feedback}/></div>}{success&&<div className="mt-5"><SuccessMessage message="Thanks! We've received your message — continue the conversation on WhatsApp."/></div>}<Button className="mt-7 w-full uppercase tracking-widest" disabled={isSubmitting}>{isSubmitting?<LoadingIndicator label="Sending"/>:"Send Message"}</Button></form>
}
