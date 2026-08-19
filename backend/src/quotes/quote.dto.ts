import {ApiProperty,ApiPropertyOptional} from "@nestjs/swagger";
import {IsDateString,IsEmail,IsIn,IsOptional,IsString,Length,MaxLength} from "class-validator";
export class CreateQuoteDto{
 @ApiProperty() @IsString() @Length(2,100) fullName!:string;
 @ApiProperty() @IsEmail() @MaxLength(254) email!:string;
 @ApiProperty() @IsString() @Length(7,30) phone!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) company?:string;
 @ApiProperty() @IsString() @Length(2,100) service!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) selectedPackage?:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) budget?:string;
 @ApiProperty() @IsDateString() deadline!:string;
 @ApiProperty({enum:["WhatsApp","Phone","Email"]}) @IsIn(["WhatsApp","Phone","Email"]) preferredContact!:string;
 @ApiProperty() @IsString() @Length(20,5000) projectDetails!:string;
 @ApiPropertyOptional({description:"Spam trap; must remain empty"}) @IsOptional() @IsString() @MaxLength(0) website?:string;
}
