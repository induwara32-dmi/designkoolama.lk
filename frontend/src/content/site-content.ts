export const approvedIconKeys = ["facebook","instagram","linkedin","behance","mail","phone","clock","map-pin","flame","pen-tool","share","monitor","box","layers","calendar","globe","flag","brush","shield","lightbulb","trophy","check","eye"] as const;
export type IconKey = typeof approvedIconKeys[number];
export type SiteLink = { label:string; href:string; visible:boolean; order:number; iconKey?:IconKey };
export type SiteContent = {
  brand:{name:string;tagline:string;description:string;homeLabel:string};
  navigation:SiteLink[];
  quoteButton:{label:string;href:string;visible:boolean};
  footer:{quickLinksTitle:string;servicesTitle:string;contactTitle:string;copyright:string;privacyLabel:string;privacyHref:string;termsLabel:string;termsHref:string};
  contact:{emails:string[];phoneLabel:string;phoneHref:string;hours:string[];address:string[]};
  social:SiteLink[];
};
export const siteContent:SiteContent={
  brand:{name:"DesignKoolama",tagline:"Design beyond imagination.",description:"A premium creative agency based in Sri Lanka, dedicated to crafting exceptional digital experiences and brand identities.",homeLabel:"DesignKoolama home"},
  navigation:[{label:"Home",href:"/",visible:true,order:0},{label:"About",href:"/about",visible:true,order:1},{label:"Portfolio",href:"/portfolio",visible:true,order:2},{label:"Package",href:"/packages",visible:true,order:3},{label:"Contact",href:"/contact",visible:true,order:4}],
  quoteButton:{label:"Get a Quote",href:"/get-a-quote",visible:true},
  footer:{quickLinksTitle:"Quick Links",servicesTitle:"Our Services",contactTitle:"Contact Info",copyright:"© 2026 Design Store Sri Lanka. All Rights Reserved. | Developed by Induwara Rajapaksha",privacyLabel:"Privacy Policy",privacyHref:"/privacy-policy",termsLabel:"Terms of Service",termsHref:"/terms"},
  contact:{emails:["hello@designkoolama.com"],phoneLabel:"+94 77 000 0000",phoneHref:"tel:+94770000000",hours:["Mon – Fri: 9:00 AM – 6:00 PM","Sat – Sun: Closed"],address:["No. 460, Thalawathugoda Road, Madiwela","Sri Jayawardenepura Kotte, Colombo, Sri Lanka"]},
  social:[{label:"Facebook",href:"#",visible:true,order:0,iconKey:"facebook"},{label:"Instagram",href:"#",visible:true,order:1,iconKey:"instagram"},{label:"Behance",href:"#",visible:true,order:2,iconKey:"behance"},{label:"LinkedIn",href:"#",visible:true,order:3,iconKey:"linkedin"}],
};
