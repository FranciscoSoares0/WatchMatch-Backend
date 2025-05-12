import {
    BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { User } from 'src/users/schema/user.schema';
import { Friends } from './schema/friends.schema';
import { InjectModel } from '@nestjs/mongoose';
import { AddFriendDto } from './dtos/add-friend.dto';
import { UsersService } from 'src/users/users.service';

interface PopulatedFriendship extends Omit<Friends, 'userId' | 'friendId'> {
  userId: User;
  friendId: User;
}

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Friends.name) private readonly friendsModel: Model<Friends>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async getUserFriends(user: User) {
    const friendships = await this.friendsModel
      .find({
        $or: [{ userId: user._id }, { friendId: user._id }],
      })
      .populate('userId', 'email')
      .populate('friendId', 'email')
      .lean<PopulatedFriendship[]>();

    return friendships.map((friendship) => {
      const friend = friendship.userId._id.equals(user._id)
        ? friendship.friendId
        : friendship.userId;

      return {
        _id: friendship._id,
        friendId: friend._id,
        friendEmail: friend.email,
      };
    });
  }

  async addFriend(user: User, friendData: AddFriendDto) {
    const { friendEmail } = friendData;

    const friend = await this.usersService.getUser({ email: friendEmail });

    if (friend._id.equals(user._id))
      throw new UnauthorizedException('Cannot add yourself');

    const existingFriendship = await this.friendsModel.findOne({
      $or: [
        { userId: user._id, friendId: friend._id },
        { userId: friend._id, friendId: user._id },
      ],
    });

    if (existingFriendship) throw new UnauthorizedException('Already friends');

    const newFriendship = await this.friendsModel.create({
      userId: user._id,
      friendId: friend._id,
    });

    return {
      message: 'Friend added successfully',
      friendship: {
        _id: newFriendship._id,
        friendId: friend._id,
        friendEmail: friend.email,
      },
    };
  }

  async removeFriend(user: User, friendId: string) {

    if (!Types.ObjectId.isValid(friendId))
        throw new BadRequestException('Invalid friend ID');

    const friend = await this.usersService.getUser({ _id: friendId });

    const friendship = await this.friendsModel.findOneAndDelete({
      $or: [
        { userId: user._id, friendId },
        { userId: friendId, friendId: user._id },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    return {
      message: 'Friend removed successfully',
    };
  }
}
