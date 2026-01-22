import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SessionEntity } from '../db/entities/session.entity';
import { getCurrent12HourWindowLabel } from '../lib/timeWindow';
import { WindowService } from '../window/window.service';

type SessionState = {
  window: string;
  completedToday: boolean;
  completedExtended: boolean;
};

type WindowBody = {
  window?: string;
};

@Controller('session')
export class SessionController {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessions: Repository<SessionEntity>,
    private readonly windowService: WindowService,
  ) {}

  private async getOrCreate(windowLabel: string): Promise<SessionEntity> {
    const existing = await this.sessions.findOne({
      where: { windowLabel },
    });

    if (existing) return existing;

    const created = this.sessions.create({
      windowLabel,
      completedToday: false,
      completedExtended: false,
    });

    return this.sessions.save(created);
  }

  @Get('current')
  async current(): Promise<SessionState> {
    const window = getCurrent12HourWindowLabel();

    // Ensure edition + session exist for current window
    await this.windowService.ensureWindowReady(window);

    const row = await this.getOrCreate(window);

    return {
      window: row.windowLabel,
      completedToday: row.completedToday,
      completedExtended: row.completedExtended,
    };
  }

  @Post('complete-today')
  async completeToday(@Body() body: WindowBody): Promise<SessionState> {
    const window = body.window ?? getCurrent12HourWindowLabel();

    // If frontend posts for a new window, ensure DB is ready
    await this.windowService.ensureWindowReady(window);

    const row = await this.getOrCreate(window);

    row.completedToday = true;
    const saved = await this.sessions.save(row);

    return {
      window: saved.windowLabel,
      completedToday: saved.completedToday,
      completedExtended: saved.completedExtended,
    };
  }

  @Post('complete-extended')
  async completeExtended(@Body() body: WindowBody): Promise<SessionState> {
    const window = body.window ?? getCurrent12HourWindowLabel();

    await this.windowService.ensureWindowReady(window);

    const row = await this.getOrCreate(window);

    row.completedToday = true;
    row.completedExtended = true;
    const saved = await this.sessions.save(row);

    return {
      window: saved.windowLabel,
      completedToday: saved.completedToday,
      completedExtended: saved.completedExtended,
    };
  }
}
