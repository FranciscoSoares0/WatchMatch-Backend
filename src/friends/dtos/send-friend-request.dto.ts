import { IsString } from "class-validator";

export class SendFriendRequestDto {

    @IsString()
    friendEmail: string;

}  