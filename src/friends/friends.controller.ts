import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/schema/user.schema';
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RespondFriendRequestDto } from './dtos/respond-friend-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {

  constructor(private readonly friendsService: FriendsService) {}

  @Get('')
  async getUserFriends(@CurrentUser() user: User) {
    return this.friendsService.getUserFriends(user);
  }

  @Post('requests')
  async sendFriendRequest(
    @CurrentUser() user: User,
    @Body() friendData: SendFriendRequestDto,
  ) {
    return this.friendsService.sendFriendRequest(user, friendData);
  }

  @Get('requests')
  async getFriendRequests(@CurrentUser() user: User) {
    return this.friendsService.getFriendRequests(user);
  }

  @Get('sent-requests')
  async getSentRequests(@CurrentUser() user: User) {
    return this.friendsService.getSentRequests(user);
  }

  @Patch('requests/:requestorId')
  async respondToFriendRequest(
    @CurrentUser() user: User,
    @Param('requestorId') requestorId: string,
    @Body() respondFriendRequestData: RespondFriendRequestDto,
  ) {
    return this.friendsService.respondToRequest(user, requestorId, respondFriendRequestData);
  }

  @Delete('/:friendId')
  async removeFriend(
    @CurrentUser() user: User,
    @Param('friendId') friendId: string,
  ) {
    return this.friendsService.removeFriend(user, friendId);
  }
}
