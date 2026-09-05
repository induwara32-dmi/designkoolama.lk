import { BadRequestException, PayloadTooLargeException } from "@nestjs/common";
import { basename } from "node:path";

export type ValidImage={mimeType:"image/jpeg"|"image/png"|"image/webp"|"image/avif";displayName:string};
const safeName=(value:string)=>{const name=basename(value).replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,200);if(!name||name==="."||name==="..")throw new BadRequestException("Original filename is invalid");return name};
export function validateImageFile(file:Express.Multer.File|undefined,maxBytes:number):ValidImage{
  if(!file?.buffer?.length)throw new BadRequestException("An image file is required");
  if(file.size>maxBytes)throw new PayloadTooLargeException("Image exceeds the configured upload limit");
  const b=file.buffer;let actual:ValidImage["mimeType"]|undefined;
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)actual="image/jpeg";
  else if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))actual="image/png";
  else if(b.length>=12&&b.subarray(0,4).toString("ascii")==="RIFF"&&b.subarray(8,12).toString("ascii")==="WEBP")actual="image/webp";
  else if(b.length>=16&&b.subarray(4,8).toString("ascii")==="ftyp"&&["avif","avis"].includes(b.subarray(8,12).toString("ascii")))actual="image/avif";
  if(!actual)throw new BadRequestException("Unsupported or invalid image file");
  if(file.mimetype!==actual)throw new BadRequestException("Image MIME type does not match its file signature");
  return{mimeType:actual,displayName:safeName(file.originalname)};
}
