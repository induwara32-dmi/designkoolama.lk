"use client";
import {zodResolver} from "@hookform/resolvers/zod";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {ErrorMessage,LoadingIndicator,SuccessMessage} from "@/components/feedback/states";
import {FormInput,FormTextarea} from "@/components/forms/fields";
import {Button} from "@/components/ui/button";
import {contactSubmissionService} from "@/services/contact";
const schema=z.object({fullName:z.string().trim().min(2,"Enter your full name"),email:z.email("Enter a valid email address"),phone:z.string().trim().min(7,"Enter a valid phone number"),subject:z.string().trim().min(3,"Enter a subject"),message:z.string().trim().min(20,"Tell us a little more")});
type Values=z.infer<typeof schema>;
export function ContactForm(){
 const [feedback,setFeedback]=useState("");const [success,setSuccess]=useState(false);
 const {register,handleSubmit,reset,formState:{errors,isSubmitting}}=useForm<Values>({resolver:zodResolver(schema)});
 const submit=async(values:Values)=>{setFeedback("");setSuccess(false);try{await contactSubmissionService.submit(values);setSuccess(true);reset()}catch(error){setFeedback(error instanceof Error?error.message:"Unable to send your message.")}};
 return <form className="quote-card" noValidate onSubmit={handleSubmit(submit)}><div className="grid gap-6 md:grid-cols-2"><FormInput label="Full Name" placeholder="John Doe" error={errors.fullName?.message}{...register("fullName")}/><FormInput label="Email Address" type="email" placeholder="john@company.com" error={errors.email?.message}{...register("email")}/><FormInput label="Phone Number" type="tel" placeholder="+94 77 123 4567" error={errors.phone?.message}{...register("phone")}/><FormInput label="Subject" placeholder="How can we help?" error={errors.subject?.message}{...register("subject")}/></div><div className="mt-6"><FormTextarea label="Message" placeholder="Tell us about your project..." error={errors.message?.message}{...register("message")}/></div>{feedback&&<div className="mt-5"><ErrorMessage message={feedback}/></div>}{success&&<div className="mt-5"><SuccessMessage message="Message sent successfully."/></div>}<Button className="mt-7 w-full uppercase tracking-widest" disabled={isSubmitting}>{isSubmitting?<LoadingIndicator label="Sending"/>:"Send Message"}</Button></form>
}
