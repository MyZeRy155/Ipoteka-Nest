import { UsersService } from './users.service';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  Post,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { toUserResponse } from './dto/user.mapper';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { Role } from './entities/role.enum';
import { Roles } from './roles-decorator';
import { RolesGuard } from './roles.guard';

@UseGuards(AuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('me')
  async getUserById(@Request() req) {
    const id = req.user.sub;
    return toUserResponse(await this.userService.getById(id));
  }
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Get()
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return this.userService.findAll(query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post('/:id/reset-password')
  async resetPasswordByAdmin(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.userService.resetPassword(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post('/:id/block-user')
  async blockUserByAdmin(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.blockUser(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @Post('/:id/unblock-user')
  async unBlockUserByAdmin(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.userService.unBlockUser(id);
  }
}
