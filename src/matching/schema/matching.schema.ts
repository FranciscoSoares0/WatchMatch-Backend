import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTypes, Types } from 'mongoose';
import { Show } from '../interfaces/show/show.interface';

@Schema()
export class Matching {
  @Prop({ type: SchemaTypes.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user1Id: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user2Id: Types.ObjectId;

  @Prop({ type: [mongoose.Schema.Types.Mixed] , required: true})
  shows: Array<Show>;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  user1ApprovedShows: Array<Show>;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  user2ApprovedShows: Array<Show>;

  @Prop({ enum: ['pending', 'completed'], default: 'pending' })
  status: string;
}

export const MatchingSchema = SchemaFactory.createForClass(Matching);
