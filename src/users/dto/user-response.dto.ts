import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 42, description: 'Идентификатор пользователя' })
  id: number;

  @ApiProperty({ example: 'Alexandr', description: 'Имя пользователя' })
  username: string;

  @ApiProperty({
    example: '2026-09-08T10:15:00.000Z',
    description: 'Момент регистрации',
  })
  createdAt: Date;
}
