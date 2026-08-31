import { WhitelistService } from './whitelist.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateWhitelistIpDto } from './dto/create-whitelist-ip.dto';
import { WhiteListIpDto } from './dto/whitelist-ip.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateWhitelistIpDto } from './dto/update-whitelist-ip.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SkipWhiteList } from './skip-whitelist.decorator';

@ApiTags('whitelist')
@Controller('whitelist')
@UseGuards(AuthGuard)
@SkipWhiteList()
export class WhiteListController {
  constructor(private readonly whitelistService: WhitelistService) {}

  @Post()
  create(@Body() dto: CreateWhitelistIpDto): Promise<WhiteListIpDto> {
    return this.whitelistService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список всех IP белого списка' })
  findAll(): Promise<WhiteListIpDto[]> {
    return this.whitelistService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'IP по идентификатору' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<WhiteListIpDto> {
    return this.whitelistService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Изменить запись белого списка' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWhitelistIpDto,
  ): Promise<WhiteListIpDto> {
    return this.whitelistService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить IP из белого списка' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.whitelistService.remove(id);
  }
}
