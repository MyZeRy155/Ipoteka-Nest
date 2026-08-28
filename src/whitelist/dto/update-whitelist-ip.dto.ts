import { PartialType } from '@nestjs/swagger';

import { CreateWhitelistIpDto } from './create-whitelist-ip.dto';

export class UpdateWhitelistIpDto extends PartialType(CreateWhitelistIpDto) {}
