import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Show } from '../interfaces/show/show.interface';
import { Type } from 'class-transformer';
import { ShowDto } from './show.dto';

export class AddMatchingDto {
  @IsString()
  user2Id: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'shows array must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => ShowDto)
  shows: Array<Show>;
}
