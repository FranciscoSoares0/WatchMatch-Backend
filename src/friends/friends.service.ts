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
import { SendFriendRequestDto } from './dtos/send-friend-request.dto';
import { UsersService } from 'src/users/users.service';
import { RespondFriendRequestDto } from './dtos/respond-friend-request.dto';

interface PopulatedFriendship extends Omit<Friends, 'userId' | 'friendId'> {
  userId: User;
  friendId: User;
}

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Friends.name) private readonly friendsModel: Model<Friends>,
    private readonly usersService: UsersService,
  ) {}

  async getUserFriends(user: User) {
    const friendships = await this.friendsModel
      .find({
        $or: [{ userId: user._id }, { friendId: user._id }],
        status: 'accepted',
      })
      .populate('userId', 'email profileImage name')
      .populate('friendId', 'email profileImage name')
      .lean<PopulatedFriendship[]>();

    return friendships.map((friendship) => {
      const friend = friendship.userId._id.equals(user._id)
        ? friendship.friendId
        : friendship.userId;

      return {
        _id: friendship._id,
        friendId: friend._id,
        friendEmail: friend.email,
        friendName: friend.name,
        friendProfileImage: friend.profileImage,
      };
    });
  }

  async getFriendRequests(user: User) {
    const requests = await this.friendsModel
      .find({ friendId: user._id, status: 'pending' })
      .populate('userId', 'name email profileImage')
      .lean<PopulatedFriendship[]>();

    return requests.map((request) => {
      return {
        _id: request._id,
        friendId: request.userId._id,
        friendEmail: request.userId.email,
        friendName: request.userId.name,
        friendProfileImage: request.userId.profileImage,
      };
    });
  }

  async getSentRequests(user: User) {
    const requests = await this.friendsModel
      .find({ userId: user._id, status: 'pending' })
      .populate('friendId', 'name email profileImage')
      .lean<PopulatedFriendship[]>();

    return requests.map((request) => ({
      _id: request._id,
      friendId: request.friendId._id,
      friendEmail: request.friendId.email,
      friendName: request.friendId.name,
      friendProfileImage: request.friendId.profileImage,
    }));
  }

  async sendFriendRequest(user: User, friendData: SendFriendRequestDto) {
    const { friendEmail } = friendData;

    const friend = await this.usersService.getUser({ email: friendEmail });

    if (friend._id.equals(user._id))
      throw new UnauthorizedException('Cannot add yourself');

    const existingFriendship = await this.friendsModel.findOne({
      $or: [
        { userId: user._id, friendId: friend._id },
        { userId: friend._id, friendId: user._id },
      ],
      status: 'accepted',
    });

    if (existingFriendship)
      throw new UnauthorizedException('You are already friends');

    const existingRequest = await this.friendsModel.findOne({
      $or: [
        { userId: user._id, friendId: friend._id },
        { userId: friend._id, friendId: user._id },
      ],
      status: 'pending',
    });

    if (existingRequest)
      throw new UnauthorizedException(
        'Friend request already sent or received',
      );

    const newRequest = await this.friendsModel.create({
      userId: user._id,
      friendId: friend._id,
      status: 'pending',
    });

    return {
      message: 'Friend request sent successfully',
      friendship: {
        _id: newRequest._id,
        friendId: friend._id,
        friendEmail: friend.email,
        friendName: friend.name,
        friendProfileImage: friend.profileImage,
      },
    };
  }

  async respondToRequest(
    user: User,
    requestorId: string,
    respondFriendRequest: RespondFriendRequestDto,
  ) {
    if (!Types.ObjectId.isValid(requestorId)) {
      throw new BadRequestException('Invalid requestor ID');
    }

    const request = await this.friendsModel
      .findOne({
        userId: requestorId,
        friendId: user._id,
        status: 'pending',
      })
      .populate('userId', 'name email profileImage')
      .lean<PopulatedFriendship>();

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    if (respondFriendRequest.accept) {
      await this.friendsModel.updateOne(
        { _id: request._id },
        { status: 'accepted' },
      );

      return {
        message: 'Friend request accepted',
        friendship: {
          _id: request._id,
          friendId: request.userId._id,
          friendName: request.userId.name,
          friendEmail: request.userId.email,
          friendProfileImage: request.userId.profileImage,
        },
      };
    } else {
      await this.friendsModel.deleteOne({ _id: request._id });
      return { message: 'Friend request rejected' };
    }
  }

  async removeFriend(user: User, friendId: string) {
    if (!Types.ObjectId.isValid(friendId))
      throw new BadRequestException('Invalid friend ID');

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
