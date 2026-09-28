import { Module } from '@nestjs/common';
import { EveningPagesController } from './evening-pages.controller.js';
import { EveningPagesService } from './evening-pages.service.js';

@Module({
  controllers: [EveningPagesController],
  providers: [EveningPagesService],
})
export class EveningPagesModule {}
