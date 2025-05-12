// google-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err, user, info, context, status) {
    const res = context.switchToHttp().getResponse();
    
    if (err || !user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/signin?error=${encodeURIComponent(err?.response.message || 'Authentication failed')}`
      );
    }

    return user;
  }
}
