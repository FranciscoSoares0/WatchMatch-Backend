import { IsArray, IsString, IsNumber } from "class-validator";

export class ShowDto {
  @IsString()
  backdrop_path: string;

  @IsArray()
  genre_ids: number[];

  @IsNumber()
  id: number;

  @IsString()
  overview: string;

  @IsString()
  poster_path: string;

  @IsString()
  release_date: string;

  @IsString()
  title: string;

  @IsNumber()
  vote_average: number;
}