import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'Alexandr',
    minLength: 3,
    maxLength: 40,
    description: 'Имя пользователя, указанное при регистрации',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username: string;

  @ApiProperty({
    example: 'strongpass',
    minLength: 8,
    description: 'Пароль в открытом виде — сверяется с bcrypt-хешем',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
