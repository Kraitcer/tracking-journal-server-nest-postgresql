import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { Body as Payload } from '../common/http.js';
import { JournalPageService } from '../common/journal-page.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { planningNextWeekPageJoiSchema } from './planning-next-week-page.schema.js';

@Injectable()
export class PlanningNextWeekPagesService extends JournalPageService {
  constructor(prisma: PrismaService) {
    super(
      prisma.planningNextWeekPage,
      planningNextWeekPageJoiSchema,
      'Planning next week page not found',
    );
  }
}

@Controller('planningNextWeekPages')
export class PlanningNextWeekPagesController {
  constructor(private readonly pages: PlanningNextWeekPagesService) {}

  @Get()
  findByUser(@Query('user_id') userId?: string) {
    return this.pages.findByUser(userId);
  }

  @Get('journal/:journal_id')
  findByJournal(@Param('journal_id') journalId: string) {
    return this.pages.findByJournal(journalId);
  }

  @Post()
  @HttpCode(200)
  create(@Body() body: Payload) {
    return this.pages.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Payload) {
    return this.pages.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.pages.remove(id);
  }
}

@Module({
  controllers: [PlanningNextWeekPagesController],
  providers: [PlanningNextWeekPagesService],
})
export class PlanningNextWeekPagesModule {}
