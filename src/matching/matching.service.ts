import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Matching } from './schema/matching.schema';
import { Model } from 'mongoose';
import { AddMatchingDto } from './dtos/add-matching.dto';
import { User } from 'src/users/schema/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MatchingService {
  constructor(
    @InjectModel(Matching.name) private readonly matchingModel: Model<Matching>,
    private readonly usersService: UsersService,
  ) {}

  async addMatching(user: User, matchingData: AddMatchingDto) {
    const { user2Id, shows } = matchingData;

    await this.usersService.getUser({ _id: user2Id });

    if (user._id.toString() === matchingData.user2Id)
      throw new UnauthorizedException('You cannot match with yourself');

    const existing = await this.matchingModel.findOne({
      $or: [
        { user1Id: user._id, user2Id: matchingData.user2Id },
        { user1Id: matchingData.user2Id, user2Id: user._id },
      ],
      status: 'pending',
    });

    if(existing)
        throw new UnauthorizedException('Matching session already exists. Please complete the current one first');

    const newMatch = new this.matchingModel({
      user1Id: user._id,
      user2Id,
      shows,
    });

    return await newMatch.save();
  }
}
