import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Throttle } from '@nestjs/throttler';
import { SkipWhiteList } from '../whitelist/skip-whitelist.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenGuard } from './refresh-token.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@SkipWhiteList()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: {} })
  @Post('login')
  signIn(@Body() dto: LoginDto) {
    return this.authService.signIn(dto.username, dto.password);
  }

  @HttpCode(HttpStatus.CREATED)
  @Throttle({ auth: {} })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: {} })
  @Post('refresh')
  refresh(@Request() req) {
    return this.authService.refreshTokens(req.user.sub, req.refreshToken);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('/users/me/password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const id = req.user.sub;
    return await this.authService.changePassword(id, dto);
  }
}
