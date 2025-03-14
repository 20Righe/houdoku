import path from 'path';
import {
  GetSeriesFunc,
  GetChaptersFunc,
  GetPageRequesterDataFunc,
  GetPageUrlsFunc,
  GetSearchFunc,
  GetImageFunc,
  ExtensionMetadata,
  PageRequesterData,
  GetDirectoryFunc,
  Chapter,
  LanguageKey,
  Series,
  SeriesStatus,
  ExtensionClientAbstract,
  GetSettingsFunc,
  SetSettingsFunc,
  GetSettingTypesFunc,
  SeriesListResponse,
  GetFilterOptionsFunc,
} from 'houdoku-extension-lib';
import { extract, getArchiveFiles } from '../../util/archives';
import { walk } from '../../util/filesystem';
import constants from '../../constants/constants.json';

export const FS_METADATA: ExtensionMetadata = {
  id: '9ef3242e-b5a0-4f56-bf2f-5e0c9f6f50ab',
  name: 'filesystem',
  url: '',
  version: '1.0.0',
  translatedLanguage: undefined,
  hasSettings: false,
  notice: 'To import a series from the filesystem, select the series directory.',
  noticeUrl: 'https://houdoku.org/docs/adding-manga/adding-from-filesystem',
  pageLoadMessage: '',
};

const isSupportedArchivePath = (str: string) => {
  return ['zip', 'rar', 'cbz', 'cbr'].some((ext) => {
    return str.endsWith(`.${ext}`);
  });
};

const parseChapterMetadata = (
  text: string
): {
  title: string;
  chapterNum: string;
  volumeNum: string;
  group: string;
} => {
  const matchChapterNum: RegExpMatchArray | null = text.match(/c\d*\.?\d+/g);
  const matchVolumeNum: RegExpMatchArray | null = text.match(/v(\d)+/g);
  const matchGroup: RegExpMatchArray | null = text.match(/\[.*\]/g);
  const matchAnyNum: RegExpMatchArray | null = text.match(/\d*\.?\d+/g);

  let chapterNum = '';
  if (matchChapterNum === null) {
    if (matchAnyNum !== null && matchVolumeNum === null) {
      chapterNum = parseFloat(matchAnyNum[0]).toString();
    }
  } else {
    const matchNumber = matchChapterNum[0].match(/\d*\.?\d+/g);
    chapterNum = matchNumber ? parseFloat(matchNumber[0]).toString() : '';
  }

  let volumeNum = '';
  if (matchVolumeNum !== null) {
    const matchNumber = matchVolumeNum[0].match(/(\d)+/g);
    volumeNum = matchNumber ? parseFloat(matchNumber[0]).toString() : '';
  }

  const group: string = matchGroup === null ? '' : matchGroup[0].replace('[', '').replace(']', '');

  return {
    title: text.trim(),
    chapterNum,
    volumeNum,
    group: group.trim(),
  };
};

export class FSExtensionClient extends ExtensionClientAbstract {
  extractPath?: string = undefined;

  setExtractPath = (extractPath: string) => {
    this.extractPath = extractPath;
  };

  getMetadata: () => ExtensionMetadata = () => {
    return FS_METADATA;
  };

  getSeries: GetSeriesFunc = (id: string) => {
    const dirName = path.basename(id);
    const series: Series = {
      id: undefined,
      extensionId: FS_METADATA.id,
      sourceId: id,
      title: dirName.trim(),
      altTitles: [],
      description: '',
      authors: [],
      artists: [],
      tags: [],
      status: SeriesStatus.COMPLETED,
      originalLanguageKey: LanguageKey.JAPANESE,
      numberUnread: 0,
      remoteCoverUrl: '',
      trackerKeys: {},
    };

    return new Promise((resolve) => {
      resolve(series);
    });
  };

  getChapters: GetChaptersFunc = (id: string) => {
    const fileList = walk(id);
    const chapterPaths: Set<string> = new Set();
    fileList.forEach((file: string) => {
      chapterPaths.add(path.dirname(file));

      if (isSupportedArchivePath(file)) {
        chapterPaths.add(file);
        chapterPaths.delete(path.dirname(file));
      }
    });

    const chapters: Chapter[] = Array.from(chapterPaths).map((chapterPath: string) => {
      const metadata = parseChapterMetadata(path.basename(chapterPath));
      return {
        sourceId: chapterPath,
        title: metadata.title,
        chapterNumber: metadata.chapterNum,
        volumeNumber: metadata.volumeNum,
        languageKey: LanguageKey.ENGLISH,
        groupName: metadata.group,
        time: new Date().getTime(),
        read: false,
      };
    });

    return new Promise((resolve) => {
      resolve(chapters);
    });
  };

  getPageRequesterData: GetPageRequesterDataFunc = (
    _seriesSourceId: string,
    chapterSourceId: string
  ) => {
    const isArchive = isSupportedArchivePath(chapterSourceId);

    let fileListPromise;
    if (isArchive) {
      fileListPromise = getArchiveFiles(chapterSourceId);
    } else {
      fileListPromise = new Promise<string[]>((resolve) => resolve(walk(chapterSourceId)));
    }

    return fileListPromise.then(async (fileList: string[]) => {
      const collator = new Intl.Collator([], { numeric: true });
      const imageFileList = fileList
        .filter((file) => constants.IMAGE_EXTENSIONS.some((ext) => file.endsWith(`.${ext}`)))
        .sort((a, b) => collator.compare(path.basename(a), path.basename(b)));

      if (isArchive && this.extractPath) {
        const extractedFilenames = await extract(chapterSourceId, imageFileList, this.extractPath);
        return {
          server: '',
          hash: '',
          numPages: extractedFilenames.length,
          pageFilenames: extractedFilenames,
        };
      }
      return new Promise((resolve) => {
        resolve({
          server: '',
          hash: '',
          numPages: imageFileList.length,
          pageFilenames: imageFileList,
        });
      });
    });
  };

  getPageUrls: GetPageUrlsFunc = (pageRequesterData: PageRequesterData) => {
    return pageRequesterData.pageFilenames;
  };

  getImage: GetImageFunc = (_series: Series, url: string) => {
    return new Promise((resolve) => {
      resolve(url);
    });
  };

  getSearch: GetSearchFunc = () => {
    return new Promise<SeriesListResponse>((resolve) =>
      resolve({ seriesList: [], hasMore: false })
    );
  };

  getDirectory: GetDirectoryFunc = () => {
    return new Promise<SeriesListResponse>((resolve) =>
      resolve({ seriesList: [], hasMore: false })
    );
  };

  getSettingTypes: GetSettingTypesFunc = () => {
    return {};
  };

  getSettings: GetSettingsFunc = () => {
    return {};
  };

  setSettings: SetSettingsFunc = () => {};

  getFilterOptions: GetFilterOptionsFunc = () => [];
}
