export type NewsCardPayload = {
  headline: string;
  whatHappened: string;
  whyItMatters: string;
  whatsNext?: string;
  source?: string;
};

export type ScreenCard =
  | { id: string; type: 'WELCOME' }
  | {
      id: string;
      type: 'HOME';
      payload: { greetingName: string; location: string; windowLabel: string };
    }
  | { id: string; type: 'NEWS'; payload: NewsCardPayload }
  | { id: string; type: 'END_TODAY' }
  | { id: string; type: 'EXTENDED' }
  | { id: string; type: 'END_EXTENDED' };

export type EditionResponse = {
  window: string;
  cards: ScreenCard[];
};
