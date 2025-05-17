import { IsEmail, IsOptional, IsString, IsStrongPassword, MinLength } from "class-validator";

export class SignupDto {

    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @IsStrongPassword()
    password: string;

    @IsOptional() 
    @IsString()
    authProvider?: 'google' | 'local';

    @IsOptional() 
    @IsString()
    profileImage?: string;
}   