import {ApiProperty,ApiPropertyOptional} from "@nestjs/swagger";
import {IsEmail,IsOptional,IsString,Length,MaxLength} from "class-validator";
export class CreateContactDto{
 @ApiProperty() @IsString() @Length(2,100) fullName!:string;
 @ApiProperty() @IsEmail() @MaxLength(254) email!:string;
 @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?:string;
 @ApiProperty() @IsString() @Length(2,150) subject!:string;
 @ApiProperty() @IsString() @Length(10,5000) message!:string;
 @ApiPropertyOptional({description:"Spam trap; must remain empty"}) @IsOptional() @IsString() @MaxLength(0) website?:string;
}
