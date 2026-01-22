import { Body, Controller, Get, Post } from '@nestjs/common';
import { getCurrent12HourWindowLabel } from '../lib/timeWindow';

type SessionState = {
  window: string;
  completedToday: boolean;
  completedExtended: boolean;
};

// In-memory store (Phase 1 only). Later: Postgres.
const sessionStore = new Map<string, SessionState>();

function getOrCreate(window: string): SessionState {
  const existing = sessionStore.get(window);
  if (existing) return existing;

  const fresh: SessionState = {
    window,
    completedToday: false,
    completedExtended: false,
  };

  sessionStore.set(window, fresh);
  return fresh;
}

@Controller('session')
export class SessionController {
  @Get('current')
  current(): SessionState {
    const window = getCurrent12HourWindowLabel();
    return getOrCreate(window);
  }

  @Post('complete-today')
  completeToday(@Body() body?: { window?: string }): SessionState {
    const window = body?.window ?? getCurrent12HourWindowLabel();
    const state = getOrCreate(window);
    state.completedToday = true;
    sessionStore.set(window, state);
    return state;
  }

  @Post('complete-extended')
  completeExtended(@Body() body?: { window?: string }): SessionState {
    const window = body?.window ?? getCurrent12HourWindowLabel();
    const state = getOrCreate(window);
    state.completedToday = true;
    state.completedExtended = true;
    sessionStore.set(window, state);
    return state;
  }
}
