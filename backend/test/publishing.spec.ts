import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { PrismaService } from "../src/prisma/prisma.service";
import { PreviewContextService } from "../src/publishing/preview-context.service";
import { PublishingService } from "../src/publishing/publishing.service";

const config=(secret?:string,ttl=900)=>({get:(key:string)=>key==="CONTENT_PREVIEW_SECRET"?secret:key==="CONTENT_PREVIEW_TTL_SECONDS"?ttl:undefined}) as unknown as ConfigService;
const admin={id:"00000000-0000-0000-0000-000000000001",email:"admin@example.test",displayName:"Admin",roles:["SUPER_ADMIN"]};
describe("signed preview contexts",()=>{
 const secret="a-distinct-preview-secret-that-is-long-enough";
 it("round trips scoped preview claims",()=>{const service=new PreviewContextService(config(secret));const token=service.sign("services","00000000-0000-0000-0000-000000000002",admin.id);expect(service.verify(token,"services","00000000-0000-0000-0000-000000000002")).toMatchObject({adminId:admin.id})});
 it("rejects a tampered signature",()=>{const service=new PreviewContextService(config(secret));const token=service.sign("services","00000000-0000-0000-0000-000000000002",admin.id);expect(()=>service.verify(`${token}x`,"services","00000000-0000-0000-0000-000000000002")).toThrow(UnauthorizedException)});
 it("rejects a token used for another record",()=>{const service=new PreviewContextService(config(secret));const token=service.sign("services","00000000-0000-0000-0000-000000000002",admin.id);expect(()=>service.verify(token,"services","00000000-0000-0000-0000-000000000003")).toThrow(UnauthorizedException)});
 it("fails closed when the preview secret is missing",()=>{expect(()=>new PreviewContextService(config()).sign("pages","00000000-0000-0000-0000-000000000002",admin.id)).toThrow(BadRequestException)});
});

describe("publishing workflow",()=>{
 const serviceFind=jest.fn(),revisionFind=jest.fn(),revisionCreate=jest.fn(),serviceUpdate=jest.fn(),activityCreate=jest.fn();
 const tx={contentRevision:{findFirst:revisionFind,create:revisionCreate},service:{update:serviceUpdate},activityLog:{create:activityCreate}};
 const prisma={service:{findFirst:serviceFind},$transaction:jest.fn((callback:(client:typeof tx)=>unknown)=>callback(tx))} as unknown as PrismaService;
 const preview=new PreviewContextService(config("a-distinct-preview-secret-that-is-long-enough"));
 let publishing:PublishingService;
 beforeEach(()=>{jest.clearAllMocks();publishing=new PublishingService(prisma,preview);serviceFind.mockResolvedValue({slug:"branding",name:"Branding",summary:"Summary",content:{hero:"Draft"},displayOrder:0,seo:null});revisionFind.mockResolvedValue({version:2});revisionCreate.mockResolvedValue({id:"revision-3"});serviceUpdate.mockResolvedValue({});activityCreate.mockResolvedValue({})});
 it("publishes an immutable next revision and audit event",async()=>{await expect(publishing.publish("services","00000000-0000-0000-0000-000000000002",admin)).resolves.toMatchObject({published:true,version:3});expect(revisionCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({version:3,publishedById:admin.id})}));expect(activityCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({action:"CONTENT_PUBLISH"})}))});
 it("issues a short-lived preview path without exposing content",async()=>{const result=await publishing.preview("services","00000000-0000-0000-0000-000000000002",admin);expect(result.path).toMatch(/^\/preview\/services\//);expect(result.path).toContain("token=");expect(result).not.toHaveProperty("data")});
 it("rejects unsupported publishing resources",()=>{expect(()=>publishing.ensureResource("settings")).toThrow(BadRequestException)});
});
