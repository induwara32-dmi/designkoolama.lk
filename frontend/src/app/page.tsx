import { HomePage } from "@/components/home/home-page";
import {homeCmsContent,type HomeCmsContent} from "@/content/home-cms";
import {loadPageSection} from "@/services/public-content";

export default async function Home(){return <HomePage content={await loadPageSection<HomeCmsContent>("home","content",homeCmsContent)}/>}
