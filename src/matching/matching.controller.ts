import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MatchingService } from './matching.service';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { User } from 'src/users/schema/user.schema';
import { AddMatchingDto } from './dtos/add-matching.dto';

@UseGuards(JwtAuthGuard)
@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('')
  async addMatching(
    @CurrentUser() user: User,
    @Body() matchingData: AddMatchingDto,
  ) {
    return this.matchingService.addMatching(user, matchingData);
  }
}
