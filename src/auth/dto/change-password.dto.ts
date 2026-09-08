import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'strongpass',
    description:
      'Текущий пароль. Требуется всегда — подтверждает, что смену инициировал владелец аккаунта, а не перехваченная сессия',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newstrongpass',
    minLength: 8,
    description: 'Новый пароль. После смены выдаётся новая пара токенов',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
