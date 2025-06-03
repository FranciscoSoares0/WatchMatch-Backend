import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Matching, MatchingSchema } from './schema/matching.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Matching.name, schema: MatchingSchema }]),
    UsersModule,
  ],
  providers: [MatchingService],
  controllers: [MatchingController],
})
export class MatchingModule {}
