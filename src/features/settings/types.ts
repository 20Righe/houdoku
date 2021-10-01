import { LanguageKey, SeriesStatus } from 'houdoku-extension-lib';
import {
  LayoutDirection,
  PageFit,
  PageView,
  ProgressFilter,
  ReaderSetting,
} from '../../models/types';

export const SET_CHAPTER_LANGUAGES = 'SET_CHAPTER_LANGUAGES';
export const SET_PAGE_FIT = 'SET_PAGE_FIT';
export const TOGGLE_PAGE_FIT = 'TOGGLE_PAGE_FIT';
export const SET_PAGE_VIEW = 'SET_PAGE_VIEW';
export const TOGGLE_PAGE_VIEW = 'TOGGLE_PAGE_VIEW';
export const SET_LAYOUT_DIRECTION = 'SET_LAYOUT_DIRECTION';
export const TOGGLE_LAYOUT_DIRECTION = 'TOGGLE_LAYOUT_DIRECTION';
export const SET_PRELOAD_AMOUNT = 'SET_PRELOAD_AMOUNT';
export const SET_REFRESH_ON_START = 'SET_REFRESH_ON_START';
export const SET_AUTO_CHECK_FOR_UPDATES = 'SET_AUTO_CHECK_FOR_UPDATES';
export const SET_AUTO_CHECK_FOR_EXTENSION_UPDATES =
  'SET_AUTO_CHECK_FOR_EXTENSION_UPDATES';
export const SET_CUSTOM_DOWNLOADS_DIR = 'SET_CUSTOM_DOWNLOADS_DIR';
export const SET_LIBRARY_COLUMNS = 'SET_LIBRARY_COLUMNS';
export const SET_LIBRARY_FILTER_STATUS = 'SET_LIBRARY_FILTER_STATUS';
export const SET_LIBRARY_FILTER_PROGRESS = 'SET_LIBRARY_FILTER_PROGRESS';
export const SET_LIBRARY_FILTER_USER_TAGS = 'SET_LIBRARY_FILTER_USER_TAGS';
export const SET_OVERLAY_PAGE_NUMBER = 'SET_OVERLAY_PAGE_NUMBER';
export const SET_HIDE_SCROLLBAR = 'SET_HIDE_SCROLLBAR';
export const SET_TRACKER_AUTO_UPDATE = 'SET_TRACKER_AUTO_UPDATE';
export const SET_DISCORD_PRESENCE_ENABLED = 'SET_DISCORD_PRESENCE_ENABLED';
export const SET_KEYBINDING = 'SET_KEYBINDING';

export interface SettingsState {
  chapterLanguages: LanguageKey[];
  refreshOnStart: boolean;
  autoCheckForUpdates: boolean;
  autoCheckForExtensionUpdates: boolean;
  customDownloadsDir: string;
  libraryColumns: number;
  libraryFilterStatus: SeriesStatus | null;
  libraryFilterProgress: ProgressFilter;
  libraryFilterUserTags: string[];
  pageFit: PageFit;
  pageView: PageView;
  layoutDirection: LayoutDirection;
  preloadAmount: number;
  overlayPageNumber: boolean;
  hideScrollbar: boolean;
  trackerAutoUpdate: boolean;
  discordPresenceEnabled: boolean;
  keyPreviousPage: string;
  keyFirstPage: string;
  keyNextPage: string;
  keyLastPage: string;
  keyScrollUp: string;
  keyScrollDown: string;
  keyPreviousChapter: string;
  keyNextChapter: string;
  keyToggleLayoutDirection: string;
  keyTogglePageView: string;
  keyTogglePageFit: string;
  keyToggleShowingSettingsModal: string;
  keyToggleShowingSidebar: string;
  keyExit: string;
  keyCloseOrBack: string;
}

interface SetChapterLanguagesAction {
  type: typeof SET_CHAPTER_LANGUAGES;
  payload: {
    chapterLanguages: LanguageKey[];
  };
}

interface SetPageFitAction {
  type: typeof SET_PAGE_FIT;
  payload: {
    pageFit: PageFit;
  };
}

interface TogglePageFitAction {
  type: typeof TOGGLE_PAGE_FIT;
}

interface SetPageViewAction {
  type: typeof SET_PAGE_VIEW;
  payload: {
    pageView: PageView;
  };
}

interface TogglePageViewAction {
  type: typeof TOGGLE_PAGE_VIEW;
}

interface SetLayoutDirectionAction {
  type: typeof SET_LAYOUT_DIRECTION;
  payload: {
    layoutDirection: LayoutDirection;
  };
}

interface ToggleLayoutDirectionAction {
  type: typeof TOGGLE_LAYOUT_DIRECTION;
}

interface SetPreloadAmountAction {
  type: typeof SET_PRELOAD_AMOUNT;
  payload: {
    preloadAmount: number;
  };
}

interface SetRefreshOnStartAction {
  type: typeof SET_REFRESH_ON_START;
  payload: {
    refreshOnStart: boolean;
  };
}

interface SetAutoCheckForUpdatesAction {
  type: typeof SET_AUTO_CHECK_FOR_UPDATES;
  payload: {
    autoCheckForUpdates: boolean;
  };
}

interface SetAutoCheckForExtensionUpdatesAction {
  type: typeof SET_AUTO_CHECK_FOR_EXTENSION_UPDATES;
  payload: {
    autoCheckForExtensionUpdates: boolean;
  };
}

interface SetCustomDownloadsDirAction {
  type: typeof SET_CUSTOM_DOWNLOADS_DIR;
  payload: {
    customDownloadsDir: string;
  };
}

interface SetLibraryColumnsAction {
  type: typeof SET_LIBRARY_COLUMNS;
  payload: {
    libraryColumns: number;
  };
}

interface SetLibraryFilterStatusAction {
  type: typeof SET_LIBRARY_FILTER_STATUS;
  payload: {
    status: SeriesStatus | null;
  };
}

interface SetLibraryFilterProgressAction {
  type: typeof SET_LIBRARY_FILTER_PROGRESS;
  payload: {
    progress: ProgressFilter;
  };
}

interface SetLibraryFilterUserTagsAction {
  type: typeof SET_LIBRARY_FILTER_USER_TAGS;
  payload: {
    userTags: string[];
  };
}

interface SetOverlayPageNumberAction {
  type: typeof SET_OVERLAY_PAGE_NUMBER;
  payload: {
    overlayPageNumber: boolean;
  };
}

interface SetHideScrollbar {
  type: typeof SET_HIDE_SCROLLBAR;
  payload: {
    hideScrollbar: boolean;
  };
}

interface SetTrackerAutoUpdateAction {
  type: typeof SET_TRACKER_AUTO_UPDATE;
  payload: {
    trackerAutoUpdate: boolean;
  };
}

interface SetDiscordPresenceEnabledAction {
  type: typeof SET_DISCORD_PRESENCE_ENABLED;
  payload: {
    discordPresenceEnabled: boolean;
  };
}

interface SetKeybindingAction {
  type: typeof SET_KEYBINDING;
  payload: {
    keySetting: ReaderSetting;
    value: string;
  };
}

export type SettingsAction =
  | SetChapterLanguagesAction
  | SetPageFitAction
  | TogglePageFitAction
  | SetPageViewAction
  | TogglePageViewAction
  | SetLayoutDirectionAction
  | ToggleLayoutDirectionAction
  | SetPreloadAmountAction
  | SetRefreshOnStartAction
  | SetAutoCheckForUpdatesAction
  | SetAutoCheckForExtensionUpdatesAction
  | SetCustomDownloadsDirAction
  | SetLibraryColumnsAction
  | SetLibraryFilterStatusAction
  | SetLibraryFilterProgressAction
  | SetLibraryFilterUserTagsAction
  | SetOverlayPageNumberAction
  | SetHideScrollbar
  | SetTrackerAutoUpdateAction
  | SetDiscordPresenceEnabledAction
  | SetKeybindingAction;
