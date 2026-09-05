import { BadGatewayException, BadRequestException, ConflictException, PayloadTooLargeException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { CloudinaryMediaProvider } from "../src/media/cloudinary-media.provider";
import { MediaUploadService } from "../src/media/media-upload.service";

const admin={id:"00000000-0000-0000-0000-000000000001",email:"admin@example.test",displayName:"Admin",roles:["SUPER_ADMIN"]};
const jpeg=Buffer.from([0xff,0xd8,0xff,0xdb,0,1]);
const file=(buffer=jpeg,mimetype="image/jpeg",name="sample.jpg"):Express.Multer.File=>({buffer,mimetype,originalname:name,size:buffer.length,fieldname:"file",encoding:"7bit",stream:undefined as never,destination:"",filename:"",path:""});
describe("MediaUploadService",()=>{
 const create=jest.fn(),findUnique=jest.fn(),update=jest.fn(),audit=jest.fn(),upload=jest.fn(),remove=jest.fn();
 const prisma={mediaAsset:{create,findUnique,update},activityLog:{create:audit}} as unknown as PrismaService;
 const config={get:(key:string,fallback?:unknown)=>key==="MEDIA_MAX_FILE_SIZE_MB"?1:key==="CLOUDINARY_FOLDER"?"designkoolama/test":fallback} as ConfigService;
 const provider={upload,remove} as unknown as CloudinaryMediaProvider;
 const service=new MediaUploadService(prisma,config,provider);
 beforeEach(()=>jest.clearAllMocks());
 it("rejects a missing file",async()=>{await expect(service.upload(undefined,"Alt",undefined,admin)).rejects.toBeInstanceOf(BadRequestException)});
 it("rejects missing alternative text",async()=>{await expect(service.upload(file(),"",undefined,admin)).rejects.toBeInstanceOf(BadRequestException)});
 it("rejects unsupported image signatures",async()=>{await expect(service.upload(file(Buffer.from("<svg>"),"image/svg+xml","x.svg"),"Alt",undefined,admin)).rejects.toBeInstanceOf(BadRequestException)});
 it("rejects spoofed MIME types",async()=>{await expect(service.upload(file(jpeg,"image/png"),"Alt",undefined,admin)).rejects.toBeInstanceOf(BadRequestException)});
 it("rejects oversized images",async()=>{await expect(service.upload(file(Buffer.concat([jpeg,Buffer.alloc(1024*1024)])),"Alt",undefined,admin)).rejects.toBeInstanceOf(PayloadTooLargeException)});
 it("surfaces provider failures without persistence",async()=>{upload.mockRejectedValue(new BadGatewayException());await expect(service.upload(file(),"Alt",undefined,admin)).rejects.toBeInstanceOf(BadGatewayException);expect(create).not.toHaveBeenCalled()});
 it("persists safe metadata and audits a successful upload",async()=>{upload.mockResolvedValue({providerId:"designkoolama/test/id",secureUrl:"https://res.cloudinary.com/example/image/upload/id.jpg",width:100,height:80,bytes:6,format:"jpg"});create.mockResolvedValue({id:"asset",providerId:"designkoolama/test/id",mimeType:"image/jpeg",bytes:6,width:100,height:80});audit.mockResolvedValue({});await expect(service.upload(file(),"Accessible alt","Caption",admin)).resolves.toMatchObject({id:"asset"});expect(create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({altText:"Accessible alt",mimeType:"image/jpeg",width:100,height:80})}));expect(audit).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({action:"MEDIA_UPLOAD"})}))});
 it("protects referenced images from deletion",async()=>{findUnique.mockResolvedValue({id:"asset",_count:{portfolioUses:1,testimonialUses:0,quoteAttachments:0}});await expect(service.remove("asset",admin)).rejects.toBeInstanceOf(ConflictException);expect(remove).not.toHaveBeenCalled();expect(update).not.toHaveBeenCalled()});
 it("protects category gallery and banner references from deletion",async()=>{findUnique.mockResolvedValue({id:"asset",_count:{portfolioUses:0,categoryCardUses:0,categoryBannerUses:0,categoryGalleryUses:1,testimonialUses:0,quoteAttachments:0}});await expect(service.remove("asset",admin)).rejects.toBeInstanceOf(ConflictException);expect(remove).not.toHaveBeenCalled()});
 it("deletes an unreferenced Cloudinary asset before archiving and audits",async()=>{findUnique.mockResolvedValue({id:"asset",providerId:"designkoolama/test/id",folder:"designkoolama/test",_count:{portfolioUses:0,testimonialUses:0,quoteAttachments:0}});remove.mockResolvedValue(undefined);update.mockResolvedValue({deletedAt:new Date()});audit.mockResolvedValue({});await expect(service.remove("asset",admin)).resolves.toEqual({archived:true});expect(remove).toHaveBeenCalledWith("designkoolama/test/id");expect(update).toHaveBeenCalled();expect(audit).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({action:"MEDIA_DELETE"})}))});
 it("preserves database state when provider deletion fails",async()=>{findUnique.mockResolvedValue({id:"asset",providerId:"designkoolama/test/id",folder:"designkoolama/test",_count:{portfolioUses:0,testimonialUses:0,quoteAttachments:0}});remove.mockRejectedValue(new BadGatewayException());await expect(service.remove("asset",admin)).rejects.toBeInstanceOf(BadGatewayException);expect(update).not.toHaveBeenCalled()});
});
