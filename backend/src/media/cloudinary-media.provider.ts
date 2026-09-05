import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { randomUUID } from "node:crypto";

export type UploadedImage = { providerId:string;secureUrl:string;width:number;height:number;bytes:number;format:string };

@Injectable()
export class CloudinaryMediaProvider {
  constructor(private readonly config:ConfigService){
    const cloudName=config.get<string>("CLOUDINARY_CLOUD_NAME"),apiKey=config.get<string>("CLOUDINARY_API_KEY"),apiSecret=config.get<string>("CLOUDINARY_API_SECRET");
    if(cloudName&&apiKey&&apiSecret)cloudinary.config({cloud_name:cloudName,api_key:apiKey,api_secret:apiSecret,secure:true});
  }
  private ensureConfigured(){if(!this.config.get<string>("CLOUDINARY_CLOUD_NAME")||!this.config.get<string>("CLOUDINARY_API_KEY")||!this.config.get<string>("CLOUDINARY_API_SECRET")||!this.config.get<string>("CLOUDINARY_FOLDER"))throw new ServiceUnavailableException("Image upload provider is not configured")}
  upload(buffer:Buffer):Promise<UploadedImage>{this.ensureConfigured();const folder=this.config.getOrThrow<string>("CLOUDINARY_FOLDER");return new Promise((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({resource_type:"image",folder,public_id:randomUUID(),use_filename:false,unique_filename:true,overwrite:false},(error,result)=>{if(error||!result)return reject(new BadGatewayException("Image provider upload failed"));const uploaded:UploadApiResponse=result;if(!uploaded.secure_url?.startsWith("https://"))return reject(new BadGatewayException("Image provider returned an insecure URL"));resolve({providerId:uploaded.public_id,secureUrl:uploaded.secure_url,width:uploaded.width,height:uploaded.height,bytes:uploaded.bytes,format:uploaded.format})});stream.on("error",()=>reject(new BadGatewayException("Image provider upload failed")));stream.end(buffer)})}
  async remove(providerId:string){this.ensureConfigured();try{const raw:unknown=await cloudinary.uploader.destroy(providerId,{resource_type:"image",invalidate:true});const status=raw&&typeof raw==="object"&&"result"in raw?String(raw.result):"";if(!["ok","not found"].includes(status))throw new Error("provider rejected deletion")}catch{throw new BadGatewayException("Image provider deletion failed")}}
}
