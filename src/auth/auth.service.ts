import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Response } from 'express';
import { User } from 'src/users/schema/user.schema';
import { TokenPayload } from './token-payload.interface';
import { SignupDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { ResetToken } from './schemas/reset-token.schema';
const { nanoid } = require('nanoid');
import { MailService } from './services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async signup(signupData: SignupDto) {
    const { name, email, password } = signupData;

    //Check if the user already exists
    const emailInUse = await this.userModel.findOne({ email });

    if (emailInUse) throw new BadRequestException('Email already in use');

    //Hash the password
    const hashedPassword = await hash(password, 10);

    //Create the user
    await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local',
    });

    return {
      message:
        'Account created successfully! Start exploring and enjoy your experience!',
    };
  }

  async login(user: User, response: Response, redirect = false) {
    //calculate expiration date for access token
    const expiresAcessToken = new Date();
    expiresAcessToken.setMilliseconds(
      expiresAcessToken.getTime() +
        parseInt(
          this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS'),
        ),
    );

    //calculate expiration date for refresh token
    const expiresRefreshToken = new Date();
    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getTime() +
        parseInt(
          this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS'),
        ),
    );

    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
    };

    //create access token
    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_ACCESS_TOKEN_EXPIRATION_MS')}ms`,
    });

    //create refresh token
    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow('JWT_REFRESH_TOKEN_EXPIRATION_MS')}ms`,
    });

    await this.usersService.updateUser(
      {
        _id: user._id,
      },
      {
        $set: { refreshToken: await hash(refreshToken, 10) },
      },
    );

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      expires: expiresAcessToken,
    });

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      expires: expiresRefreshToken,
    });

    if (redirect)
      response.redirect(this.configService.getOrThrow('FRONTEND_URL'));
    else
      response.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
  }

  async changePassword(userId, oldPassword: string, newPassword: string) {
    //Check if the user exists
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('User not found');

    //Check if the password is correct
    const passwordMatches = await compare(oldPassword, user.password);

    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    //Change user password and hash
    const newHashedPassword = await hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

  async forgotPassword(email: string) {
    //Check if the user exists
    const user = await this.userModel.findOne({ email });

    if (user) {
      //If user exisrts, generate reset link
      const resetToken = nanoid(64);
      await this.resetTokenModel.create({
        token: resetToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });
      //Send link to the user by email
      this.mailService.sendPasswordResetEmail(email, resetToken);
    }

    return {
      message:
        'If the email is registered, a password reset link has been sent.',
    };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    //Find a valid reset token document
    const token = await this.resetTokenModel.findOneAndDelete({
      token: resetToken,
      expiresAt: { $gte: new Date() }, // Check if the token is not expired
    });

    if (!token) throw new UnauthorizedException('Invalid link');

    const user = await this.userModel.findById(token.userId);

    if (!user) throw new NotFoundException('User not found');

    //Hash and change password
    user.password = await hash(newPassword, 10);
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async verifyUser(email: string, password: string) {
      const user = await this.usersService.getUser({ email });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.authProvider !== 'local') {
        console.log('User is not local');
        throw new UnauthorizedException('No account associated with this email for password login. Please use Google login.');
      }

      const authenticated = await compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
  }

  async verifyUserRefreshToken(refreshToken: string, userId: string) {
    try {
      const user = await this.usersService.getUser({ _id: userId });
      const authenticated = await compare(refreshToken, user.refreshToken!);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (e) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }
  }
}
