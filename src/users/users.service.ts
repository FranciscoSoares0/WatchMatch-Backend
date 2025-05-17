import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { hash } from 'bcryptjs';
import { SignupDto } from 'src/auth/dtos/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async createUser(data: SignupDto) {
    if (data.authProvider === 'local') {
      data.password = await hash(data.password, 10);
    }
    const createdUser = new this.userModel(data);
    await createdUser.save();
    return createdUser;
  }

  async getUser(query: FilterQuery<User>) {
    const user = await this.userModel.findOne(query);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUser(query: FilterQuery<User>) {
    return this.userModel.findOne(query);
  }

  async getUsers() {
    return this.userModel.find({});
  }

  async updateUser(query: FilterQuery<User>, data: UpdateQuery<User>) {
    return this.userModel.findOneAndUpdate(query, data);
  }

  async getOrCreateUser(data: SignupDto) {
    const user = await this.userModel.findOne({ email: data.email });
    if (user && data.password === '') {
      return user;
    }
    return this.createUser(data);
  }
}
