import { IsString, IsStrongPassword, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {

    @IsString()
    @IsStrongPassword()
    oldPassword: string;

    @IsString()
    @IsStrongPassword()
    newPassword: string;

}  