import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { Chapter, Series } from 'houdoku-extension-lib';
import {
  setSeriesList,
  setSeries,
  setChapterList,
  setCompletedStartReload,
  setReloadingSeriesList,
} from './actions';
import db from '../../services/db';
import {
  deleteAllDownloadedChapters,
  deleteThumbnail,
} from '../../util/filesystem';
import { downloadCover } from '../../util/download';
import { setStatusText } from '../statusbar/actions';
import { FS_METADATA } from '../../services/extensions/filesystem';
import ipcChannels from '../../constants/ipcChannels.json';

export function loadSeriesList(dispatch: any) {
  db.fetchSerieses()
    .then((response: any) => dispatch(setSeriesList(response)))
    .catch((err: Error) => log.error(err));
}

export function loadSeries(dispatch: any, id: number) {
  db.fetchSeries(id)
    .then((response: any) => dispatch(setSeries(response[0])))
    .catch((err: Error) => log.error(err));
}

export function loadChapterList(dispatch: any, seriesId: number) {
  db.fetchChapters(seriesId)
    .then((response: any) => dispatch(setChapterList(response)))
    .catch((err: Error) => log.error(err));
}

export function removeSeries(
  dispatch: any,
  series: Series,
  deleteDownloadedChapters = false
) {
  if (series.id === undefined) return;

  db.deleteSeries(series.id)
    .then(() => {
      deleteThumbnail(series);
      // eslint-disable-next-line promise/always-return
      if (deleteDownloadedChapters) {
        deleteAllDownloadedChapters(series);
      }
      loadSeriesList(dispatch);
    })
    .catch((err: Error) => log.error(err));
}

export async function importSeries(dispatch: any, series: Series) {
  log.debug(
    `Importing series ${series.sourceId} from extension ${series.extensionId}`
  );
  dispatch(setStatusText(`Adding "${series.title}" to your library...`));

  const chapters: Chapter[] = await ipcRenderer.invoke(
    ipcChannels.EXTENSION.GET_CHAPTERS,
    series.extensionId,
    series.sourceType,
    series.sourceId
  );

  const addResponse = await db.addSeries(series);
  const addedSeries: Series = addResponse[0] as Series;
  await db.addChapters(chapters, addedSeries);
  await db.updateSeriesNumberUnread(addedSeries);
  await loadSeriesList(dispatch);
  downloadCover(addedSeries);

  log.debug(`Imported series ${series.sourceId} with database ID ${series.id}`);
  dispatch(setStatusText(`Added "${addedSeries.title}" to your library.`));
}

export function toggleChapterRead(
  dispatch: any,
  chapter: Chapter,
  series: Series
) {
  log.debug(
    `Toggling chapter read status for series ${series.title} chapterNum ${chapter.chapterNumber}`
  );

  const newChapter: Chapter = { ...chapter, read: !chapter.read };

  if (series.id !== undefined) {
    db.addChapters([newChapter], series)
      .then(() => db.updateSeriesNumberUnread(series))
      .then(() => {
        if (series.id !== undefined) {
          loadChapterList(dispatch, series.id);
          loadSeries(dispatch, series.id);
        }
        return true;
      })
      .catch((err: Error) => log.error(err));
  }
}

async function reloadSeries(series: Series): Promise<Error | void> {
  if (series.id === undefined)
    return new Promise((resolve) =>
      resolve(Error('Series does not have database ID'))
    );

  if (
    (await ipcRenderer.invoke(
      ipcChannels.EXTENSION_MANAGER.GET,
      series.extensionId
    )) === undefined
  ) {
    return new Promise((resolve) =>
      resolve(Error('Could not retrieve extension data'))
    );
  }

  let newSeries: Series | undefined = await ipcRenderer.invoke(
    ipcChannels.EXTENSION.GET_SERIES,
    series.extensionId,
    series.sourceType,
    series.sourceId
  );
  if (newSeries === undefined)
    return new Promise((resolve) =>
      resolve(Error('Could not get series from extension'))
    );

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
    newSeries.userTags = series.userTags;
  }

  const oldChapters: Chapter[] = (await db.fetchChapters(
    series.id
  )) as Chapter[];
  const orphanedChapterIds: number[] = oldChapters.map(
    (chapter: Chapter) => chapter.id || -1
  );

  const chapters: Chapter[] = newChapters.map((chapter: Chapter) => {
    const matchingChapter: Chapter | undefined = oldChapters.find(
      (c: Chapter) => c.sourceId === chapter.sourceId
    );
    if (matchingChapter !== undefined && matchingChapter.id !== undefined) {
      chapter.id = matchingChapter.id;
      chapter.read = matchingChapter.read;

      orphanedChapterIds.splice(
        orphanedChapterIds.indexOf(matchingChapter.id),
        1
      );
    }
    return chapter;
  });

  await db.addSeries(newSeries);
  await db.addChapters(chapters, newSeries);
  if (orphanedChapterIds.length > 0) {
    await db.deleteChaptersById(orphanedChapterIds);
  }
  await db.updateSeriesNumberUnread(newSeries);

  return new Promise((resolve) => resolve());
}

export async function reloadSeriesList(
  dispatch: any,
  seriesList: Series[],
  callback?: () => void
) {
  log.debug(`Reloading series list...`);

  dispatch(setReloadingSeriesList(true));

  const sortedSeriesList = [...seriesList].sort((a: Series, b: Series) =>
    a.title.localeCompare(b.title)
  );
  let cur = 0;
  let errs = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const series of sortedSeriesList) {
    dispatch(
      setStatusText(
        `Reloading library (${cur}/${seriesList.length}) - ${series.title}`
      )
    );
    // eslint-disable-next-line no-await-in-loop
    const ret = await reloadSeries(series);
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
      errs > 0
        ? `Reloaded ${cur} series with ${errs} errors`
        : `Reloaded ${cur} series`;
  }

  dispatch(setReloadingSeriesList(false));
  dispatch(setCompletedStartReload(true));
  dispatch(setStatusText(statusMessage));
  if (callback !== undefined) callback();
}

export async function updateSeriesUserTags(
  series: Series,
  userTags: string[],
  callback?: () => void
) {
  const newSeries: Series = { ...series, userTags };
  await db.addSeries(newSeries);
  if (callback !== undefined) callback();
}

export async function updateSeriesTrackerKeys(
  series: Series,
  trackerKeys: { [trackerId: string]: string } | undefined,
  callback?: () => void
) {
  const newSeries: Series = { ...series, trackerKeys };
  await db.addSeries(newSeries);
  if (callback !== undefined) callback();
}
