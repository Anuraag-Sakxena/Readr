export type RssItem = {
  title: string;
  link: string;
  isoDate?: string;
  source?: string;
  snippet?: string;
};

export type RssFetchResult = {
  items: RssItem[];
  errors: string[];
};
