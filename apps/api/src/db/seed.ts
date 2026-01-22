import type { EditionResponse, ScreenCard } from '@readr/contracts';
import type { DataSource } from 'typeorm';

import { EditionEntity } from './entities/edition.entity';
import { CardEntity } from './entities/card.entity';
import { SessionEntity } from './entities/session.entity';

function getPayload(card: ScreenCard): Record<string, unknown> | null {
  if (card.type === 'HOME')
    return card.payload as unknown as Record<string, unknown>;
  if (card.type === 'NEWS')
    return card.payload as unknown as Record<string, unknown>;
  return null;
}

export async function seedIfEmpty(
  dataSource: DataSource,
  edition: EditionResponse,
) {
  const editionRepo = dataSource.getRepository(EditionEntity);
  const sessionRepo = dataSource.getRepository(SessionEntity);

  const existing = await editionRepo.findOne({
    where: { windowLabel: edition.window },
  });

  if (existing) return;

  const ed = new EditionEntity();
  ed.windowLabel = edition.window;

  ed.cards = edition.cards.map((c, idx) => {
    const card = new CardEntity();
    card.cardId = c.id;
    card.type = c.type;
    card.position = idx;
    card.payload = getPayload(c);
    card.edition = ed;
    return card;
  });

  await editionRepo.save(ed);

  const sess = new SessionEntity();
  sess.windowLabel = edition.window;
  sess.completedToday = false;
  sess.completedExtended = false;

  await sessionRepo.save(sess);
}
