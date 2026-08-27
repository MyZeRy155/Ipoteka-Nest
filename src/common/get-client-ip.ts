import { Request } from 'express';

export function getClientIp(request: Request): string {
  const remoteAddress = request.socket.remoteAddress;
  if (!remoteAddress) {
    return 'unknown';
  } else {
    const regex: RegExp = /^::ffff:([\d.]+)/i;
    const ip = remoteAddress.match(regex);
    return ip ? ip[1] : remoteAddress;
  }
}
