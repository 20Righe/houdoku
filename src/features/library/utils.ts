import fs from 'fs';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { Chapter, LanguageKey, Series } from 'houdoku-extension-lib';
import React from 'react';
import { SetterOrUpdater } from 'recoil';
import { openConfirmModal } from '@mantine/modals';
import { Text } from '@mantine/core';
import {
  deleteAllDownloadedChapters,
  deleteThumbnail,
  getThumbnailPath,
} from '../../util/filesystem';
import { downloadCover } from '../../util/download';
import { FS_METADATA } from '../../services/extensions/filesystem';
import ipcChannels from '../../constants/ipcChannels.json';
import library from '../../services/library';
import { getNumberUnreadChapters } from '../../util/comparison';
import routes from '../../constants/routes.json';

const updateSeriesNumberUnread = (series: Series, chapterLanguages: LanguageKey[]) => {
  if (series.id !== undefined) {
    const chapters: Chapter[] = library.fetchChapters(series.id);
    library.upsertSeries({
      ...series,
      numberUnread: getNumberUnreadChapters(
        chapters.filter((chapter) => chapterLanguages.includes(chapter.languageKey))
      ),
    });
  }
};

export function loadSeriesList(setSeriesList: (seriesList: Series[]) => void) {
  const seriesList: Series[] = library.fetchSeriesList();
  setSeriesList(seriesList);
}

export function loadSeries(seriesId: string, setSeries: (series: Series) => void) {
  const series: Series | null = library.fetchSeries(seriesId);
  if (series !== null) {
    setSeries(series);
  }
}

export function loadChapterList(
  seriesId: string,
  setChapterList: (chapterList: Chapter[]) => void
) {
  const chapters: Chapter[] = library.fetchChapters(seriesId);
  setChapterList(chapters);
}

export function removeSeries(
  series: Series,
  setSeriesList: (seriesList: Series[]) => void,
  deleteDownloadedChapters = false,
  downloadsDir = ''
) {
  if (series.id === undefined) return;

  library.removeSeries(series.id);
  deleteThumbnail(series);
  if (deleteDownloadedChapters) {
    deleteAllDownloadedChapters(series, downloadsDir);
  }
  loadSeriesList(setSeriesList);
}

export async function importSeries(
  series: Series,
  setStatusText: (statusText: string) => void,
  chapterLanguages: LanguageKey[]
): Promise<Series> {
  log.debug(`Importing series ${series.sourceId} from extension ${series.extensionId}`);
  setStatusText(`Adding "${series.title}" to your library...`);

  const chapters: Chapter[] = await ipcRenderer.invoke(
    ipcChannels.EXTENSION.GET_CHAPTERS,
    series.extensionId,
    series.sourceType,
    series.sourceId
  );

  const addedSeries = library.upsertSeries(series);
  library.upsertChapters(chapters, addedSeries);
  updateSeriesNumberUnread(addedSeries, chapterLanguages);

  log.debug(`Imported series ${series.sourceId} with database ID ${series.id}`);
  setStatusText(`Added "${addedSeries.title}" to your library.`);
  return addedSeries;
}

export function markChapters(
  chapters: Chapter[],
  series: Series,
  read: boolean,
  setChapterList: (chapterList: Chapter[]) => void,
  setSeries: (series: Series) => void,
  chapterLanguages: LanguageKey[]
) {
  if (series.id !== undefined) {
    const newChapters = chapters.map((chapter) => ({ ...chapter, read }));
    library.upsertChapters(newChapters, series);
    updateSeriesNumberUnread(series, chapterLanguages);
    loadChapterList(series.id, setChapterList);
    loadSeries(series.id, setSeries);
  }
}

// eslint-disable-next-line consistent-return
async function reloadSeries(
  series: Series,
  chapterLanguages: LanguageKey[]
): Promise<Error | void> {
  log.info(`Reloading series ${series.id} - ${series.title}`);
  if (series.id === undefined) {
    return new Promise((resolve) => resolve(Error('Series does not have database ID')));
  }

  if (
    (await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.GET, series.extensionId)) === undefined
  ) {
    return new Promise((resolve) => resolve(Error('Could not retrieve extension data')));
  }

  let newSeries: Series | undefined = await ipcRenderer.invoke(
    ipcChannels.EXTENSION.GET_SERIES,
    series.extensionId,
    series.sourceType,
    series.sourceId
  );
  if (newSeries === undefined)
    return new Promise((resolve) => resolve(Error('Could not get series from extension')));

  const newChapters: Chapter[] = await ipcRenderer.invoke(
    ipcChannels.EXTENSION.GET_CHAPTERS,
    series.extensionId,
    series.sourceType,
    series.sourceId
  );

  if (series.extensionId === FS_METADATA.id) {
    newSeries = { ...series };
  } else {
    newSeries.id = series.id;
    newSeries.trackerKeys = series.trackerKeys;
  }

  const oldChapters: Chapter[] = library.fetchChapters(series.id);
  const orphanedChapterIds: string[] = oldChapters.map((chapter: Chapter) => chapter.id || '');

  const chapters: Chapter[] = newChapters.map((chapter: Chapter) => {
    const matchingChapter: Chapter | undefined = oldChapters.find(
      (c: Chapter) => c.sourceId === chapter.sourceId
    );
    if (matchingChapter !== undefined && matchingChapter.id !== undefined) {
      chapter.id = matchingChapter.id;
      chapter.read = matchingChapter.read;

      orphanedChapterIds.splice(orphanedChapterIds.indexOf(matchingChapter.id), 1);
    }
    return chapter;
  });

  library.upsertSeries(newSeries);
  library.upsertChapters(chapters, newSeries);
  if (orphanedChapterIds.length > 0 && newSeries.id !== undefined) {
    library.removeChapters(orphanedChapterIds, newSeries.id);
  }

  updateSeriesNumberUnread(newSeries, chapterLanguages);

  // download the cover as a thumbnail if the remote URL has changed or
  // there is no existing thumbnail
  const thumbnailPath = await getThumbnailPath(series);
  if (thumbnailPath !== null) {
    if (newSeries.remoteCoverUrl !== series.remoteCoverUrl || !fs.existsSync(thumbnailPath)) {
      log.debug(`Updating cover for series ${newSeries.id}`);
      deleteThumbnail(series);
      downloadCover(newSeries);
    }
  }
}

export async function reloadSeriesList(
  seriesList: Series[],
  setSeriesList: (seriesList: Series[]) => void,
  setReloadingSeriesList: (reloadingSeriesList: boolean) => void,
  setStatusText: (statusText: string) => void,
  chapterLanguages: LanguageKey[]
) {
  log.debug(`Reloading series list...`);
  setReloadingSeriesList(true);

  const sortedSeriesList = [...seriesList].sort((a: Series, b: Series) =>
    a.title.localeCompare(b.title)
  );
  let cur = 0;
  let errs = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const series of sortedSeriesList) {
    setStatusText(`Reloading library (${cur}/${seriesList.length}) - ${series.title}`);
    // eslint-disable-next-line no-await-in-loop
    const ret = await reloadSeries(series, chapterLanguages);
    if (ret instanceof Error) {
      log.error(ret);
      errs += 1;
    }
    cur += 1;
  }

  let statusMessage = '';
  if (cur === 1) {
    statusMessage =
      errs > 0
        ? `Error occurred while reloading series "${seriesList[0].title}"`
        : `Reloaded series "${seriesList[0].title}"`;
  } else {
    statusMessage =
      errs > 0 ? `Reloaded ${cur} series with ${errs} errors` : `Reloaded ${cur} series`;
  }

  setSeriesList(library.fetchSeriesList());
  setReloadingSeriesList(false);
  setStatusText(statusMessage);
}

export function updateSeries(series: Series) {
  const newSeries = library.upsertSeries(series);
  return downloadCover(newSeries);
}

export function updateSeriesTrackerKeys(
  series: Series,
  trackerKeys: { [trackerId: string]: string } | undefined
) {
  library.upsertSeries({ ...series, trackerKeys });
}

export function migrateSeriesTags() {
  const seriesList: Series[] = library.fetchSeriesList();
  seriesList.forEach((series) => {
    const tags: string[] = [];
    ['formats', 'genres', 'demographics', 'contentWarnings', 'themes', 'tagKeys'].forEach(
      (oldField) => {
        if (oldField in series) {
          // @ts-expect-error handling deprecated key
          tags.push(...series[oldField]);
          // @ts-expect-error handling deprecated key
          delete series[oldField];

          library.upsertSeries({ ...series, tags });
        }
      }
    );
  });
}

export async function goToSeries(
  series: Series,
  setSeriesList: SetterOrUpdater<Series[]>,
  history: any
) {
  if (series.id !== undefined) {
    if (
      (await ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.GET, series.extensionId)) ===
      undefined
    ) {
      openConfirmModal({
        title: 'Extension not found',
        centered: true,
        children: React.createElement(Text, { size: 'sm' }, [
          'The extension for this series is not loaded. To view the series, please reinstall the extension. Or, you may remove the series from your library.',
          React.createElement(Text, { color: 'dimmed' }, `(extension: ${series.extensionId})`),
        ]),
        labels: { confirm: 'Remove from library', cancel: 'Cancel' },
        confirmProps: { color: 'red' },
        onConfirm: () => removeSeries(series, setSeriesList),
      });
    } else {
      history.push(`${routes.SERIES}/${series.id}`);
    }
  }
}
