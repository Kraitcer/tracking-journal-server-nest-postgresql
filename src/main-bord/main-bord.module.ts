import { Module } from '@nestjs/common';
import { MainBordController } from './main-bord.controller.js';

@Module({
  controllers: [MainBordController],
})
export class MainBordModule {}
