import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;
}
