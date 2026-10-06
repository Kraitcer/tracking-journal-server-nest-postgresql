import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { DescriptionsModule } from './descriptions/descriptions.module.js';
import { EveningPagesModule } from './evening-pages/evening-pages.module.js';
import { FreeDaysModule } from './free-days/free-days.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { HabitsModule } from './habits/habits.module.js';
import { JournalsModule } from './journals/journals.module.js';
import { MainBordModule } from './main-bord/main-bord.module.js';
import { MorningPagesModule } from './morning-pages/morning-pages.module.js';
import { PlanningNextWeekPagesModule } from './planning-next-week-pages/planning-next-week-pages.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { SubTasksModule } from './sub-tasks/sub-tasks.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthGuard } from './users/auth.guard.js';
import { WeekInReviewPagesModule } from './week-in-review-pages/week-in-review-pages.module.js';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    JournalsModule,
    MainBordModule,
    HabitsModule,
    MorningPagesModule,
    EveningPagesModule,
    ProjectsModule,
    DescriptionsModule,
    UploadsModule,
    GoalsModule,
    TasksModule,
    SubTasksModule,
    WeekInReviewPagesModule,
    PlanningNextWeekPagesModule,
    FreeDaysModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
