import {Injectable} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import type {CreateContactDto} from "./contact.dto";
@Injectable() export class ContactService{constructor(private readonly prisma:PrismaService){} async create(dto:CreateContactDto){const item=await this.prisma.contactMessage.create({data:{fullName:dto.fullName.trim(),email:dto.email.trim().toLowerCase(),phone:dto.phone?.trim()||null,subject:dto.subject.trim(),message:dto.message.trim()},select:{id:true,status:true,createdAt:true}});return item}}
