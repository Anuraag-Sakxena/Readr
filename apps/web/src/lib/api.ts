import type { EditionResponse } from '@readr/contracts';

export type SessionState = {
  window: string;
  completedToday: boolean;
  completedExtended: boolean;
};

export async function fetchCurrentEdition(): Promise<EditionResponse> {
  const res = await fetch('http://localhost:3001/edition/current', {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = (await res.json()) as EditionResponse;
  if (!data?.cards || !Array.isArray(data.cards)) {
    throw new Error('Invalid edition response');
  }

  return data;
}

export async function fetchCurrentSession(): Promise<SessionState> {
  const res = await fetch('http://localhost:3001/session/current', {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Session API error ${res.status}`);

  return (await res.json()) as SessionState;
}

export async function completeToday(window: string): Promise<SessionState> {
  const res = await fetch('http://localhost:3001/session/complete-today', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ window }),
  });

  if (!res.ok) throw new Error(`Complete-today API error ${res.status}`);

  return (await res.json()) as SessionState;
}

export async function completeExtended(window: string): Promise<SessionState> {
  const res = await fetch('http://localhost:3001/session/complete-extended', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ window }),
  });

  if (!res.ok) throw new Error(`Complete-extended API error ${res.status}`);

  return (await res.json()) as SessionState;
}
