import { GeoService } from './geo.service';
import { getClientIp } from '../common/get-client-ip';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('geo')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class GeoController {
  constructor(private readonly geoService: GeoService) {}
  @Get('me')
  async getMyGeo(@Req() request: Request) {
    const ip = getClientIp(request);
    return this.geoService.getGeoLocation(ip);
  }
}
