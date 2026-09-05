import {Type} from "class-transformer";
import {IsInt,IsOptional,IsString,Max,Min} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
export class PortfolioQueryDto{
 @ApiPropertyOptional() @IsOptional() @IsString() category?:string;
 @ApiPropertyOptional({default:1}) @Type(()=>Number) @IsInt() @Min(1) page=1;
 @ApiPropertyOptional({default:12,maximum:50}) @Type(()=>Number) @IsInt() @Min(1) @Max(50) limit=12;
}
export class PackageQueryDto{@ApiPropertyOptional() @IsOptional() @IsString() category?:string}
