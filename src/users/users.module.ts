import { Module } from '@nestjs/common';
import { LoginController } from './login.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [LoginController, UsersController],
  providers: [UsersService],
})
export class UsersModule {}
