import log from 'electron-log';
import { LanguageKey, SeriesStatus } from 'houdoku-extension-lib';
import {
  GeneralSetting,
  IntegrationSetting,
  LayoutDirection,
  PageFit,
  PageView,
  ProgressFilter,
  ReaderSetting,
  TrackerSetting,
} from '../../models/types';
import persistantStore from '../../util/persistantStore';
import storeKeys from '../../constants/storeKeys.json';

export const DEFAULT_GENERAL_SETTINGS = {
  [GeneralSetting.ChapterLanguages]: [LanguageKey.ENGLISH],
  [GeneralSetting.RefreshOnStart]: true,
  [GeneralSetting.AutoCheckForUpdates]: true,
  [GeneralSetting.AutoCheckForExtensionUpdates]: true,
  [GeneralSetting.LibraryColumns]: 4,
  [GeneralSetting.LibraryFilterStatus]: null,
  [GeneralSetting.LibraryFilterProgress]: ProgressFilter.All,
  [GeneralSetting.LibraryFilterUserTags]: [],
};

export const DEFAULT_READER_SETTINGS = {
  [ReaderSetting.LayoutDirection]: LayoutDirection.LeftToRight,
  [ReaderSetting.PageView]: PageView.Single,
  [ReaderSetting.PageFit]: PageFit.Auto,
  [ReaderSetting.PreloadAmount]: 2,
  [ReaderSetting.OverlayPageNumber]: false,
};

export const DEFAULT_TRACKER_SETTINGS = {
  [TrackerSetting.TrackerAutoUpdate]: true,
};

export const DEFAULT_INTEGRATION_SETTINGS = {
  [IntegrationSetting.DiscordPresenceEnabled]: false,
};

const getStoreValues = (
  storePrefix: string,
  settingEnum:
    | typeof GeneralSetting
    | typeof ReaderSetting
    | typeof TrackerSetting
    | typeof IntegrationSetting
): {
  [key in
    | GeneralSetting
    | ReaderSetting
    | TrackerSetting
    | IntegrationSetting]?: string | null;
} => {
  const values: {
    [key in
      | GeneralSetting
      | ReaderSetting
      | TrackerSetting
      | IntegrationSetting]?: string | null;
  } = {};
  Object.values(settingEnum).forEach(
    (
      setting:
        | GeneralSetting
        | ReaderSetting
        | TrackerSetting
        | IntegrationSetting
    ) => {
      values[setting] = persistantStore.read(`${storePrefix}${setting}`);
    }
  );

  return values;
};

export function getStoredGeneralSettings(): { [key in GeneralSetting]?: any } {
  const settings: { [key in GeneralSetting]?: any } = {};
  const storeValues = getStoreValues(
    storeKeys.SETTINGS.GENERAL_PREFIX,
    GeneralSetting
  );

  if (storeValues[GeneralSetting.ChapterLanguages] !== null) {
    settings[GeneralSetting.ChapterLanguages] = storeValues[
      GeneralSetting.ChapterLanguages
    ]?.split(',') as LanguageKey[];
  }
  if (storeValues[GeneralSetting.RefreshOnStart] !== null) {
    settings[GeneralSetting.RefreshOnStart] =
      storeValues[GeneralSetting.RefreshOnStart] === 'true';
  }
  if (storeValues[GeneralSetting.AutoCheckForUpdates] !== null) {
    settings[GeneralSetting.AutoCheckForUpdates] =
      storeValues[GeneralSetting.AutoCheckForUpdates] === 'true';
  }
  if (storeValues[GeneralSetting.AutoCheckForExtensionUpdates] !== null) {
    settings[GeneralSetting.AutoCheckForExtensionUpdates] =
      storeValues[GeneralSetting.AutoCheckForExtensionUpdates] === 'true';
  }
  if (storeValues[GeneralSetting.LibraryColumns] !== null) {
    settings[GeneralSetting.LibraryColumns] = parseInt(
      storeValues[GeneralSetting.LibraryColumns] as string,
      10
    );
  }
  if (
    storeValues[GeneralSetting.LibraryFilterStatus] !== null &&
    storeValues[GeneralSetting.LibraryFilterStatus] !== 'null'
  ) {
    settings[GeneralSetting.LibraryFilterStatus] = storeValues[
      GeneralSetting.LibraryFilterStatus
    ] as SeriesStatus;
  }
  if (storeValues[GeneralSetting.LibraryFilterProgress] !== null) {
    settings[GeneralSetting.LibraryFilterProgress] = storeValues[
      GeneralSetting.LibraryFilterProgress
    ] as ProgressFilter;
  }
  if (storeValues[GeneralSetting.LibraryFilterUserTags] !== null) {
    const tags =
      storeValues[GeneralSetting.LibraryFilterUserTags]?.split(',') || [];
    if (tags.every((tag: string) => tag !== '')) {
      settings[GeneralSetting.LibraryFilterUserTags] = tags;
    }
  }

  log.debug(`Using general settings: ${JSON.stringify(settings)}`);
  return settings;
}

export function getStoredReaderSettings(): { [key in ReaderSetting]?: any } {
  const settings: { [key in ReaderSetting]?: any } = {};
  const storeValues = getStoreValues(
    storeKeys.SETTINGS.READER_PREFIX,
    ReaderSetting
  );

  if (storeValues[ReaderSetting.LayoutDirection] !== null) {
    settings[ReaderSetting.LayoutDirection] = parseInt(
      storeValues[ReaderSetting.LayoutDirection] as string,
      10
    );
  }
  if (storeValues[ReaderSetting.PageFit] !== null) {
    settings[ReaderSetting.PageFit] = parseInt(
      storeValues[ReaderSetting.PageFit] as string,
      10
    );
  }
  if (storeValues[ReaderSetting.PageView] !== null) {
    settings[ReaderSetting.PageView] = parseInt(
      storeValues[ReaderSetting.PageView] as string,
      10
    );
  }
  if (storeValues[ReaderSetting.PreloadAmount] !== null) {
    settings[ReaderSetting.PreloadAmount] = parseInt(
      storeValues[ReaderSetting.PreloadAmount] as string,
      10
    );
  }
  if (storeValues[ReaderSetting.OverlayPageNumber] !== null) {
    settings[ReaderSetting.OverlayPageNumber] =
      storeValues[ReaderSetting.OverlayPageNumber] === 'true';
  }

  log.debug(`Using reader settings: ${JSON.stringify(settings)}`);
  return settings;
}

export function getStoredTrackerSettings(): { [key in TrackerSetting]?: any } {
  const settings: { [key in TrackerSetting]?: any } = {};
  const storeValues = getStoreValues(
    storeKeys.SETTINGS.TRACKER_PREFIX,
    TrackerSetting
  );

  if (storeValues[TrackerSetting.TrackerAutoUpdate] !== null) {
    settings[TrackerSetting.TrackerAutoUpdate] =
      storeValues[TrackerSetting.TrackerAutoUpdate] === 'true';
  }

  log.debug(`Using tracker settings: ${JSON.stringify(settings)}`);
  return settings;
}

export function getStoredIntegrationSettings(): {
  [key in IntegrationSetting]?: any;
} {
  const settings: { [key in IntegrationSetting]?: any } = {};
  const storeValues = getStoreValues(
    storeKeys.SETTINGS.INTEGRATION_PREFIX,
    IntegrationSetting
  );

  if (storeValues[IntegrationSetting.DiscordPresenceEnabled] !== null) {
    settings[IntegrationSetting.DiscordPresenceEnabled] =
      storeValues[IntegrationSetting.DiscordPresenceEnabled] === 'true';
  }

  log.debug(`Using integration settings: ${JSON.stringify(settings)}`);
  return settings;
}

export function saveGeneralSetting(key: GeneralSetting, value: any) {
  persistantStore.write(`${storeKeys.SETTINGS.GENERAL_PREFIX}${key}`, value);
  log.info(`Set GeneralSetting ${key} to ${value}`);
}

export function saveReaderSetting(key: ReaderSetting, value: any) {
  persistantStore.write(`${storeKeys.SETTINGS.READER_PREFIX}${key}`, value);
  log.info(`Set ReaderSetting ${key} to ${value}`);
}

export function saveTrackerSetting(key: TrackerSetting, value: any) {
  persistantStore.write(`${storeKeys.SETTINGS.TRACKER_PREFIX}${key}`, value);
  log.info(`Set TrackerSetting ${key} to ${value}`);
}

export function saveIntegrationSetting(key: IntegrationSetting, value: any) {
  persistantStore.write(
    `${storeKeys.SETTINGS.INTEGRATION_PREFIX}${key}`,
    value
  );
  log.info(`Set IntegrationSetting ${key} to ${value}`);
}
