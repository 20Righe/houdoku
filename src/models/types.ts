export type Series = {
  id?: number;
  extensionId: number;
  sourceId: string;
  title: string;
  altTitles: string[];
  description: string;
  authors: string[];
  artists: string[];
  genres: Genre[];
  themes: Theme[];
  contentWarnings: ContentWarning[];
  formats: Format[];
  status: SeriesStatus;
  originalLanguageKey: LanguageKey;
  numberUnread: number;
  remoteCoverUrl: string;
};

export type Chapter = {
  id?: number;
  seriesId?: number;
  sourceId: string;
  title: string;
  chapterNumber: string;
  volumeNumber: string;
  languageKey: LanguageKey;
  groupName: string;
  time: number;
  read: boolean;
};

export enum LanguageKey {
  ARABIC,
  BENGALI,
  BULGARIAN,
  BURMESE,
  CATALAN,
  CHINESE_SIMP,
  CHINESE_TRAD,
  CZECH,
  DANISH,
  DUTCH,
  ENGLISH,
  FILIPINO,
  FINNISH,
  FRENCH,
  GERMAN,
  GREEK,
  HEBREW,
  HINDI,
  HUNGARIAN,
  INDONESIAN,
  ITALIAN,
  JAPANESE,
  KOREAN,
  LITHUANIAN,
  MALAY,
  MONGOLIAN,
  PERSIAN,
  POLISH,
  PORTUGUESE_BR,
  PORTUGUESE_PT,
  ROMANIAN,
  RUSSIAN,
  SERBO_CROATIAN,
  SPANISH_ES,
  SPANISH_LATAM,
  SWEDISH,
  THAI,
  TURKISH,
  UKRAINIAN,
  VIETNAMESE,
}

export type Language = {
  key: LanguageKey;
  name: string;
  flagCode: string;
};

export enum ProgressFilter {
  All,
  Unread,
  Finished,
}

export enum GeneralSetting {
  ChapterLanguages = 'ChapterLanguages',
  RefreshOnStart = 'RefreshOnStart',
}

export enum ReaderSetting {
  PageFit = 'PageFit',
  LayoutDirection = 'LayoutDirection',
  PageView = 'PageView',
  PreloadAmount = 'PreloadAmount',
}

export enum PageFit {
  Auto,
  Width,
  Height,
}

export enum LayoutDirection {
  LeftToRight,
  RightToLeft,
}

export enum PageView {
  Single,
  Double,
  Double_OddStart,
}

export enum SeriesStatus {
  ONGOING,
  COMPLETED,
  CANCELLED,
}

export enum Genre {
  ACTION,
  ADVENTURE,
  COMEDY,
  DRAMA,
  FANTASY,
  HISTORICAL,
  HORROR,
  MECHA,
  MEDICAL,
  MYSTERY,
  PSYCHOLOGICAL,
  ROMANCE,
  SCI_FI,
  SHOUJO_AI,
  SHOUNEN_AI,
  SLICE_OF_LIFE,
  SPORTS,
  TRAGEDY,
  YAOI,
  YURI,
  ISEKAI,
  CRIME,
  MAGICAL_GIRLS,
  PHILOSOPHICAL,
  SUPERHERO,
  THRILLER,
  WUXIA,
}

export enum Theme {
  COOKING,
  GYARU,
  HAREM,
  MARTIAL_ARTS,
  MUSIC,
  SCHOOL_LIFE,
  SUPERNATURAL,
  VIDEO_GAMES,
  ALIENS,
  ANIMALS,
  CROSSDRESSING,
  DEMONS,
  DELINQUENTS,
  GENDERSWAP,
  GHOSTS,
  MONSTER_GIRLS,
  LOLI,
  MAGIC,
  MILITARY,
  MONSTERS,
  NINJA,
  OFFICE_WORKERS,
  POLICE,
  POST_APOCALYPTIC,
  REINCARNATION,
  REVERSE_HAREM,
  SAMURAI,
  SHOTA,
  SURVIVAL,
  TIME_TRAVEL,
  VAMPIRES,
  TRADITIONAL_GAMES,
  VIRTUAL_REALITY,
  ZOMBIES,
  INCEST,
  MAFIA,
  VILLAINESS,
}

export enum Format {
  YONKOMA,
  AWARD_WINNING,
  DOUJINSHI,
  ONESHOT,
  LONG_STRIP,
  ADAPTATION,
  ANTHOLOGY,
  WEB_COMIC,
  FULL_COLOR,
  USER_CREATED,
  OFFICIAL_COLORED,
  FAN_COLORED,
}

export enum ContentWarning {
  ECCHI,
  SMUT,
  GORE,
  SEXUAL_VIOLENCE,
}
