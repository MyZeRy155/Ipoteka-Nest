export interface AuditMeta {
  userId: number | null;
  ip: string;
  method: string;
  url: string;
  statusCode: number;
}
