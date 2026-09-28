import { Module } from '@nestjs/common';
import { MorningPagesController } from './morning-pages.controller.js';
import { MorningPagesService } from './morning-pages.service.js';

@Module({
  controllers: [MorningPagesController],
  providers: [MorningPagesService],
})
export class MorningPagesModule {}
