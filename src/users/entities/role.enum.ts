export enum Role {
  User = 'user',
  Admin = 'admin',
  SuperAdmin = 'superAdmin',
}

export const ROLE_RANK: Record<Role, number> = {
  [Role.User]: 0,
  [Role.Admin]: 1,
  [Role.SuperAdmin]: 2,
};
