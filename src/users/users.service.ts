import { Injectable } from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
    private readonly users = [
        {
            userId: 1,
            username: 'Alexandr',
            password: 'strongpass'
        },
        {
            userId: 2,
            username: 'Anastasia',
            password: 'verystrongpass'
        }
        ];

    async findOne(username: string): Promise<User> {
        return this.users.find(user => username === username);
    }
}
