import { SetMetadata } from '@nestjs/common';

export const SKIP_WHITELIST_KEY = 'skipWhiteList';
export const SkipWhiteList = () => SetMetadata(SKIP_WHITELIST_KEY, true);
