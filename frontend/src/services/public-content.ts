import type {PackageExperience} from "@/content/packages";
import type {PortfolioProject} from "@/content/portfolio";
import type {ServiceContent} from "@/content/services";
const apiUrl=process.env.API_URL??process.env.NEXT_PUBLIC_API_URL;
const fallbackEnabled=process.env.CONTENT_FALLBACK_ENABLED==="true";
type Envelope<T>={data:T};
async function get<T>(path:string):Promise<T>{if(!apiUrl)throw new Error("Public content API is not configured");const response=await fetch(`${apiUrl}${path}`,{next:{revalidate:60},signal:AbortSignal.timeout(8_000)});if(response.status===404)throw new Error("NOT_FOUND");if(!response.ok)throw new Error("Public content API unavailable");const body=await response.json() as Partial<Envelope<T>>;if(!body.data)throw new Error("Invalid public content response");return body.data}
export async function loadService(slug:string,fallback?:ServiceContent){try{return (await get<{content:ServiceContent}>(`/public/services/${slug}`)).content}catch(error){if(fallbackEnabled&&fallback){console.warn(`[content-fallback] service:${slug}`);return fallback}throw error}}
export async function loadPortfolio(fallback?:PortfolioProject[]){try{return (await get<{items:Array<{content:PortfolioProject}>}>("/public/portfolio?limit=50")).items.map(item=>item.content)}catch(error){if(fallbackEnabled&&fallback){console.warn("[content-fallback] portfolio");return fallback}throw error}}
export async function loadProject(slug:string,fallback?:PortfolioProject){try{return (await get<{content:PortfolioProject}>(`/public/portfolio/${slug}`)).content}catch(error){if(fallbackEnabled&&fallback){console.warn(`[content-fallback] portfolio:${slug}`);return fallback}throw error}}
export async function loadPackages(fallback?:readonly PackageExperience[]){try{const rows=await get<Array<{content:PackageExperience}>>("/public/packages");return rows.map(row=>row.content).filter(item=>item&&item.slug)}catch(error){if(fallbackEnabled&&fallback){console.warn("[content-fallback] packages");return [...fallback]}throw error}}
