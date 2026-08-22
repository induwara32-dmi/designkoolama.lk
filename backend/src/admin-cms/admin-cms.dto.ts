import { IsIn, IsObject, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export const cmsResources = ["pages","services","portfolio-categories","portfolio","package-categories","packages","testimonials","media","settings","quotes","contacts","activity"] as const;
export type CmsResource = typeof cmsResources[number];

export class CmsMutationDto {
  @IsObject() data!: Record<string, unknown>;
}
export class SubmissionStatusDto {
  @IsIn(["NEW","IN_PROGRESS","REPLIED","CLOSED","SPAM"]) status!: "NEW"|"IN_PROGRESS"|"REPLIED"|"CLOSED"|"SPAM";
}
export class CmsListQueryDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsString() @IsIn(["DRAFT","PUBLISHED","ARCHIVED","NEW","IN_PROGRESS","REPLIED","CLOSED","SPAM"]) status?: string;
}
export class CmsIdDto { @IsUUID() id!: string; }
