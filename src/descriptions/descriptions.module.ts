import { Module } from '@nestjs/common';
import { DescriptionsController } from './descriptions.controller.js';
import { DescriptionsService } from './descriptions.service.js';

@Module({
  controllers: [DescriptionsController],
  providers: [DescriptionsService],
})
export class DescriptionsModule {}
