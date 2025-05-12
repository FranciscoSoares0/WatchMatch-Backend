import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema()
export class User {
    @Prop({type: SchemaTypes.ObjectId, auto: true})
    _id: Types.ObjectId;

    @Prop({required: true})
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop()
    refreshToken?: string;
    
    @Prop({
        required: function (this: User) {
          return this.authProvider === 'local';
        }
      })
      password: string;

    @Prop({ enum: ['google', 'local'], default: 'local' })
    authProvider: string;
}

export const UserSchema =  SchemaFactory.createForClass(User);