import { IsString, IsStrongPassword, Matches, MinLength } from "class-validator";

export class AddFriendDto {

    @IsString()
    friendEmail: string;

}  