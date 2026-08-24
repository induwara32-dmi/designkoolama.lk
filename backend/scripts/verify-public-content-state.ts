import { ContentStatus, Prisma } from "@prisma/client";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";
import { PrismaService } from "../src/prisma/prisma.service";
import { PublishingService } from "../src/publishing/publishing.service";
import type { PublishableResource } from "../src/publishing/publishing.types";
import {siteContent} from "../../frontend/src/content/site-content";
import {homeCmsContent} from "../../frontend/src/content/home-cms";
import {aboutCmsContent} from "../../frontend/src/content/about-cms";
import {contactCmsContent} from "../../frontend/src/content/contact-cms";
import {quoteCmsContent} from "../../frontend/src/content/quote-cms";
import {routeUiContent} from "../../frontend/src/content/route-ui-cms";

loadEnvFile(resolve(process.cwd(), ".env"));
const prisma = new PrismaService();

async function main() {
  await prisma.$connect();
  const email = process.env.INITIAL_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Missing INITIAL_SUPER_ADMIN_EMAIL");
  const user = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, displayName: true, roles: { select: { role: { select: { name: true } } } } },
  });
  if (!user) throw new Error("Initial Super Admin is not provisioned");
  const sitePage=await prisma.page.upsert({where:{slug:"site-settings"},update:{deletedAt:null},create:{slug:"site-settings",title:"Shared website content",status:ContentStatus.PUBLISHED}});
  await prisma.pageSection.upsert({where:{pageId_key:{pageId:sitePage.id,key:"site"}},update:{isEnabled:true},create:{pageId:sitePage.id,key:"site",kind:"site-settings",content:siteContent,displayOrder:0,isEnabled:true}});
  const homePage=await prisma.page.findUniqueOrThrow({where:{slug:"home"}}),homeSection=await prisma.pageSection.findUnique({where:{pageId_key:{pageId:homePage.id,key:"content"}}});
  const initializeHome=!homeSection;
  if(initializeHome)await prisma.pageSection.create({data:{pageId:homePage.id,key:"content",kind:"home-content",content:homeCmsContent,displayOrder:0,isEnabled:true}});
  const aboutPage=await prisma.page.findUniqueOrThrow({where:{slug:"about"}}),aboutSection=await prisma.pageSection.findUnique({where:{pageId_key:{pageId:aboutPage.id,key:"content"}}}),initializeAbout=!aboutSection;
  if(initializeAbout)await prisma.pageSection.create({data:{pageId:aboutPage.id,key:"content",kind:"about-content",content:aboutCmsContent,displayOrder:0,isEnabled:true}});
  const contactPage=await prisma.page.findUniqueOrThrow({where:{slug:"contact"}}),contactSection=await prisma.pageSection.findUnique({where:{pageId_key:{pageId:contactPage.id,key:"content"}}}),initializeContact=!contactSection;
  if(initializeContact)await prisma.pageSection.create({data:{pageId:contactPage.id,key:"content",kind:"contact-content",content:contactCmsContent,displayOrder:0,isEnabled:true}});
  const quotePage=await prisma.page.findUniqueOrThrow({where:{slug:"get-a-quote"}}),quoteSection=await prisma.pageSection.findUnique({where:{pageId_key:{pageId:quotePage.id,key:"content"}}}),initializeQuote=!quoteSection;
  if(initializeQuote)await prisma.pageSection.create({data:{pageId:quotePage.id,key:"content",kind:"quote-content",content:quoteCmsContent,displayOrder:0,isEnabled:true}});
  const quoteDraft=quoteSection?.content as {form?:{instructions?:string}}|undefined;
  const refreshQuote=quoteDraft?.form?.instructions==="Share the essentials below. We will request project files securely after confirming your brief.";
  if(refreshQuote&&quoteSection)await prisma.pageSection.update({where:{id:quoteSection.id},data:{content:quoteCmsContent}});
  const routePage=await prisma.page.upsert({where:{slug:"route-content"},update:{deletedAt:null},create:{slug:"route-content",title:"Shared route labels",status:ContentStatus.PUBLISHED}}),routeSection=await prisma.pageSection.findUnique({where:{pageId_key:{pageId:routePage.id,key:"ui"}}}),initializeRoutes=!routeSection;
  if(initializeRoutes)await prisma.pageSection.create({data:{pageId:routePage.id,key:"ui",kind:"route-ui-content",content:routeUiContent,displayOrder:0,isEnabled:true}});
  const routeDraft=routeSection?.content as {packages?:{stats?:unknown[]}}|undefined,refreshRoutes=Boolean(routeSection&&!routeDraft?.packages?.stats);
  if(refreshRoutes&&routeSection)await prisma.pageSection.update({where:{id:routeSection.id},data:{content:routeUiContent}});
  const admin = { id: user.id, email: user.email, displayName: user.displayName, roles: user.roles.map(({ role }) => role.name) };
  const missing: Array<{ resource: PublishableResource; ids: string[] }> = [
    { resource: "pages", ids: (await prisma.page.findMany({ where: { deletedAt: null, status: ContentStatus.PUBLISHED, publishedSnapshot: { equals: Prisma.DbNull } }, select: { id: true } })).map(({ id }) => id) },
    { resource: "services", ids: (await prisma.service.findMany({ where: { deletedAt: null, status: ContentStatus.PUBLISHED, publishedSnapshot: { equals: Prisma.DbNull } }, select: { id: true } })).map(({ id }) => id) },
    { resource: "portfolio", ids: (await prisma.portfolioProject.findMany({ where: { deletedAt: null, status: ContentStatus.PUBLISHED, publishedSnapshot: { equals: Prisma.DbNull } }, select: { id: true } })).map(({ id }) => id) },
    { resource: "packages", ids: (await prisma.package.findMany({ where: { isActive: true, status: ContentStatus.PUBLISHED, publishedSnapshot: { equals: Prisma.DbNull } }, select: { id: true } })).map(({ id }) => id) },
    { resource: "testimonials", ids: (await prisma.testimonial.findMany({ where: { status: ContentStatus.PUBLISHED, publishedSnapshot: { equals: Prisma.DbNull } }, select: { id: true } })).map(({ id }) => id) },
  ];
  const publishing = new PublishingService(prisma, undefined as never);
  let repaired = 0;
  if(initializeHome){await publishing.publish("pages",homePage.id,admin);repaired+=1}
  if(initializeAbout){await publishing.publish("pages",aboutPage.id,admin);repaired+=1}
  if(initializeContact){await publishing.publish("pages",contactPage.id,admin);repaired+=1}
  if(initializeQuote){await publishing.publish("pages",quotePage.id,admin);repaired+=1}
  else if(refreshQuote){await publishing.publish("pages",quotePage.id,admin);repaired+=1}
  if(initializeRoutes){await publishing.publish("pages",routePage.id,admin);repaired+=1}
  else if(refreshRoutes){await publishing.publish("pages",routePage.id,admin);repaired+=1}
  for (const { resource, ids } of missing) {
    for (const id of ids) {
      await publishing.publish(resource, id, admin);
      repaired += 1;
    }
  }
  console.log(`Published snapshot verification complete; repaired ${repaired} record(s).`);
}

main().finally(() => prisma.$disconnect());
