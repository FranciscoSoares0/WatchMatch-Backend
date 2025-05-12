import { IsString, IsStrongPassword } from "class-validator";

export class ResetPasswordDto {

    @IsString()
    resetToken: string;

    @IsString()
    @IsStrongPassword()
    newPassword: string;
    
}   