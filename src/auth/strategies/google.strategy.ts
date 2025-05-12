import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_AUTH_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_AUTH_REDIRECT_URI'),
      scope: ['profile', 'email'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    if (!profile.emails || !profile.emails[0]?.value) {
      throw new UnauthorizedException('No email found in Google profile');
    }

    const email = profile.emails[0]?.value;

    const existingUser = await this.usersService.getUser({ email });
    if (existingUser && existingUser.authProvider === 'local') {
      throw new UnauthorizedException(
         'This email is already registered using password login. Please use password login to access your account.',
      );
    }

    const user = await this.usersService.getOrCreateUser({
      name: profile.displayName,
      email: profile.emails[0]?.value,
      password: '',
      authProvider: 'google',
    });

    return user;
  }
}
