"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

export function FaqAccordion({ items }: { items: ReadonlyArray<{ question: string; answer: string }> }) {
  const [open, setOpen] = useState(0); const reduce = useReducedMotion();
  return <div className="faq-list">{items.map((item,index) => { const active=open===index; return <div className={`faq-item${active ? " faq-active" : ""}`} key={item.question}><h3><button type="button" onClick={() => setOpen(active ? -1 : index)} aria-expanded={active} aria-controls={`faq-${index}`}><span>{item.question}</span><span className="faq-toggle">{active ? <Minus/> : <Plus/>}</span></button></h3><AnimatePresence initial={false}>{active && <motion.div id={`faq-${index}`} role="region" initial={reduce ? false : { height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:reduce ? 0 : .25 }}><p>{item.answer}</p></motion.div>}</AnimatePresence></div>; })}</div>;
}
