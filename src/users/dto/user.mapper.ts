import { User } from '../entities/user.entity';
import { UserResponseDto } from './user-response.dto';

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}
