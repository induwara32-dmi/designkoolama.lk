import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from "class-validator";

export class LoginDto {
  @ApiProperty() @IsEmail() @Length(3, 254) email!: string;
  @ApiProperty() @IsString() @Length(1, 200) password!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() rememberMe?: boolean;
}

export class ForgotPasswordDto { @ApiProperty() @IsEmail() @Length(3, 254) email!: string; }

export class ResetPasswordDto {
  @ApiProperty() @IsString() @Length(32, 500) token!: string;
  @ApiProperty() @IsString() @Length(12, 200) @Matches(/[A-Z]/) @Matches(/[a-z]/) @Matches(/\d/) @Matches(/[^A-Za-z0-9]/) password!: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @Length(1, 200) currentPassword!: string;
  @ApiProperty() @IsString() @Length(12, 200) @Matches(/[A-Z]/) @Matches(/[a-z]/) @Matches(/\d/) @Matches(/[^A-Za-z0-9]/) newPassword!: string;
}

