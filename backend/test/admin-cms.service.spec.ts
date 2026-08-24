import { BadRequestException, ConflictException } from "@nestjs/common";
import type { PrismaService } from "../src/prisma/prisma.service";
import { AdminCmsService } from "../src/admin-cms/admin-cms.service";

const admin={id:"00000000-0000-0000-0000-000000000001",email:"admin@example.test",displayName:"Admin",roles:["SUPER_ADMIN"]};
describe("AdminCmsService",()=>{
 const activityCreate=jest.fn(),serviceCreate=jest.fn(),serviceFindMany=jest.fn(),quoteFind=jest.fn(),quoteUpdate=jest.fn(),mediaFind=jest.fn(),mediaUpdate=jest.fn();
 const prisma={activityLog:{create:activityCreate},service:{create:serviceCreate,findMany:serviceFindMany},quoteRequest:{findUnique:quoteFind,update:quoteUpdate},contactMessage:{findUnique:jest.fn(),update:jest.fn()},mediaAsset:{findUnique:mediaFind,update:mediaUpdate}} as unknown as PrismaService;
 let service:AdminCmsService;
 beforeEach(()=>{jest.clearAllMocks();service=new AdminCmsService(prisma)});
 it("rejects invalid service slugs before persistence",async()=>{await expect(service.create("services",{slug:"Not Safe",name:"Branding",summary:"Summary",content:{}},admin)).rejects.toBeInstanceOf(BadRequestException);expect(serviceCreate).not.toHaveBeenCalled()});
 it("creates content and records an audit event",async()=>{const created={id:"service-1",slug:"branding"};serviceCreate.mockResolvedValue(created);activityCreate.mockResolvedValue({});await expect(service.create("services",{slug:"branding",name:"Branding",summary:"Summary",content:{}},admin)).resolves.toEqual(created);expect(activityCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({action:"CMS_CREATE",entityType:"services",entityId:"service-1"})}))});
 it("allows only HTTPS media URLs",async()=>{await expect(service.create("media",{providerId:"asset",url:"http://unsafe.test/a.jpg",title:"Asset",altText:"Alt",mimeType:"image/jpeg",bytes:10},admin)).rejects.toBeInstanceOf(BadRequestException)});
 it("does not archive referenced media",async()=>{mediaFind.mockResolvedValue({_count:{portfolioUses:1,testimonialUses:0,quoteAttachments:0}});await expect(service.remove("media","asset-id",admin)).rejects.toBeInstanceOf(ConflictException);expect(mediaUpdate).not.toHaveBeenCalled()});
 it("updates a submission and records before and after values",async()=>{quoteFind.mockResolvedValue({id:"quote-1",status:"NEW"});quoteUpdate.mockResolvedValue({id:"quote-1",status:"REPLIED"});activityCreate.mockResolvedValue({});await expect(service.updateSubmission("quotes","quote-1","REPLIED",admin)).resolves.toMatchObject({status:"REPLIED"});expect(activityCreate).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({action:"SUBMISSION_STATUS"})}))});
 it("passes normalized search criteria to list queries",async()=>{serviceFindMany.mockResolvedValue([]);await service.list("services",{search:"brand"});expect(serviceFindMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({OR:expect.any(Array)})}))});
 it("accepts only allowlisted CMS icon keys",async()=>{await expect(service.create("services",{slug:"branding",name:"Branding",summary:"Summary",content:{iconKey:"<svg onload=alert(1)>"}},admin)).rejects.toBeInstanceOf(BadRequestException);expect(serviceCreate).not.toHaveBeenCalled()});
 it("rejects scriptable CMS links",async()=>{await expect(service.create("services",{slug:"branding",name:"Branding",summary:"Summary",content:{buttonHref:"javascript:alert(1)"}},admin)).rejects.toBeInstanceOf(BadRequestException);expect(serviceCreate).not.toHaveBeenCalled()});
});
