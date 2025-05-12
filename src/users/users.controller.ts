import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from './schema/user.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendsService } from 'src/friends/friends.service';
import { AddFriendDto } from 'src/friends/dtos/add-friend.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly friendsService: FriendsService,
  ) {}

  @Get('/:userId/friends')  
  async getUserFriends(@CurrentUser() user: User) {
    return this.friendsService.getUserFriends(user);
  }

  @Post('/:userId/friends')
  async addFriend(@CurrentUser() user: User, @Body() friendData: AddFriendDto) {
    return this.friendsService.addFriend(user,friendData);
  }

  @Delete('/:userId/friends/:friendId')
  async removeFriend(@CurrentUser() user: User, @Param('friendId') friendId: string,) {
    return this.friendsService.removeFriend(user, friendId);
  }
}
