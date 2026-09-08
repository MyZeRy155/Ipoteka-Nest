import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Alexandr',
    minLength: 3,
    maxLength: 40,
    description:
      'Имя пользователя. Должно быть уникальным — при совпадении вернётся 409',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;

  @ApiProperty({
    example: 'strongpass',
    minLength: 8,
    description: 'Пароль. Хранится только в виде bcrypt-хеша',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
