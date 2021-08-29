import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
import Mousetrap from 'mousetrap';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import {
  PageRequesterData,
  Chapter,
  Series,
  SeriesSourceType,
} from 'houdoku-extension-lib';
import { RootState } from '../../store';
import {
  changePageNumber,
  setPageNumber,
  setPageUrls,
  setSource,
  setRelevantChapterList,
  toggleShowingSettingsModal,
  setPageDataList,
  toggleShowingSidebar,
} from '../../features/reader/actions';
import styles from './ReaderPage.css';
import routes from '../../constants/routes.json';
import { LayoutDirection, PageFit, PageView } from '../../models/types';
import { selectMostSimilarChapter } from '../../util/comparison';
import ReaderSettingsModal from './ReaderSettingsModal';
import {
  setLayoutDirection,
  setPageFit,
  setPageView,
  setPreloadAmount,
  toggleLayoutDirection,
  togglePageFit,
  togglePageView,
} from '../../features/settings/actions';
import { toggleChapterRead } from '../../features/library/utils';
import { useForceUpdate } from '../../util/reactutil';
import ReaderSidebar from './ReaderSidebar';
import ReaderViewer from './ReaderViewer';
import ReaderPreloadContainer from './ReaderPreloadContainer';
import ReaderLoader from './ReaderLoader';
import { sendProgressToTrackers } from '../../features/tracker/utils';
import ipcChannels from '../../constants/ipcChannels.json';
import { FS_METADATA } from '../../services/extensions/filesystem';
import {
  getChapterDownloaded,
  getChapterDownloadPath,
} from '../../util/filesystem';
import library from '../../services/library';

const mapState = (state: RootState) => ({
  pageNumber: state.reader.pageNumber,
  lastPageNumber: state.reader.lastPageNumber,
  pageUrls: state.reader.pageUrls,
  pageDataList: state.reader.pageDataList,
  series: state.reader.series,
  chapter: state.reader.chapter,
  relevantChapterList: state.reader.relevantChapterList,
  showingSettingsModal: state.reader.showingSettingsModal,
  showingSidebar: state.reader.showingSidebar,
  pageFit: state.settings.pageFit,
  pageView: state.settings.pageView,
  layoutDirection: state.settings.layoutDirection,
  preloadAmount: state.settings.preloadAmount,
  trackerAutoUpdate: state.settings.trackerAutoUpdate,
  discordPresenceEnabled: state.settings.discordPresenceEnabled,
  keyPreviousPage: state.settings.keyPreviousPage,
  keyFirstPage: state.settings.keyFirstPage,
  keyNextPage: state.settings.keyNextPage,
  keyLastPage: state.settings.keyLastPage,
  keyPreviousChapter: state.settings.keyPreviousChapter,
  keyNextChapter: state.settings.keyNextChapter,
  keyToggleLayoutDirection: state.settings.keyToggleLayoutDirection,
  keyTogglePageView: state.settings.keyTogglePageView,
  keyTogglePageFit: state.settings.keyTogglePageFit,
  keyToggleShowingSettingsModal: state.settings.keyToggleShowingSettingsModal,
  keyToggleShowingSidebar: state.settings.keyToggleShowingSidebar,
  keyExit: state.settings.keyExit,
  keyCloseOrBack: state.settings.keyCloseOrBack,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  setPageNumber: (pageNumber: number) => dispatch(setPageNumber(pageNumber)),
  changePageNumber: (delta: number) => dispatch(changePageNumber(delta)),
  setPageFit: (pageFit: PageFit) => dispatch(setPageFit(pageFit)),
  togglePageFit: () => dispatch(togglePageFit()),
  setPageView: (pageView: PageView) => dispatch(setPageView(pageView)),
  togglePageView: () => dispatch(togglePageView()),
  setLayoutDirection: (layoutDirection: LayoutDirection) =>
    dispatch(setLayoutDirection(layoutDirection)),
  toggleLayoutDirection: () => dispatch(toggleLayoutDirection()),
  setPreloadAmount: (preloadAmount: number) =>
    dispatch(setPreloadAmount(preloadAmount)),
  setPageUrls: (pageUrls: string[]) => dispatch(setPageUrls(pageUrls)),
  setPageDataList: (pageDataList: string[]) =>
    dispatch(setPageDataList(pageDataList)),
  setSource: (series?: Series, chapter?: Chapter) =>
    dispatch(setSource(series, chapter)),
  setRelevantChapterList: (relevantChapterList: Chapter[]) =>
    dispatch(setRelevantChapterList(relevantChapterList)),
  toggleShowingSettingsModal: () => dispatch(toggleShowingSettingsModal()),
  toggleShowingSidebar: () => dispatch(toggleShowingSidebar()),
  toggleChapterRead: (chapter: Chapter, series: Series) =>
    toggleChapterRead(dispatch, chapter, series),
  sendProgressToTrackers: (chapter: Chapter, series: Series) =>
    sendProgressToTrackers(chapter, series),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

interface ParamTypes {
  series_id: string;
  chapter_id: string;
}

const ReaderPage: React.FC<Props> = (props: Props) => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { series_id, chapter_id } = useParams<ParamTypes>();
  const history = useHistory();
  const location = useLocation();
  const forceUpdate = useForceUpdate();

  /**
   * Populate the relevantChapterList prop.
   * This prop is used to identify the chapters shown in the selector dropdown (and which can be
   * accessed by pressing next/previous chapter on the UI). There is one entry for each unique
   * chapter number matching the current chapter's release language, as long as one exists. If there
   * are multiple to choose from, we try to find one with the same group.
   * See also comparison.selectMostSimilarChapter
   * @param series the series to find relevant chapters for
   * @param chapter the current chapter to find other chapters in relation to
   */
  const createRelevantChapterList = (series: Series, chapter: Chapter) => {
    if (series.id === undefined) return;

    const relevantChapterList: Chapter[] = [];
    const chapters: Chapter[] = library.fetchChapters(series.id);

    const chapterNumbersSet: Set<string> = new Set();
    chapters.forEach((c: Chapter) => chapterNumbersSet.add(c.chapterNumber));
    const chapterNumbers: number[] = Array.from(chapterNumbersSet)
      .map((chapterNumberStr: string) => parseFloat(chapterNumberStr))
      .sort((a, b) => a - b)
      .reverse();

    chapterNumbers.forEach((chapterNumber: number) => {
      const curChapters: Chapter[] = chapters.filter(
        (c: Chapter) => parseFloat(c.chapterNumber) === chapterNumber
      );

      const bestMatch: Chapter | null = selectMostSimilarChapter(
        chapter,
        curChapters
      );
      if (bestMatch !== null && bestMatch.id !== undefined) {
        relevantChapterList.push(bestMatch);
      }
    });

    props.setRelevantChapterList(relevantChapterList);
  };

  const loadDownloadedChapterData = async (
    series: Series,
    chapter: Chapter
  ) => {
    log.debug(
      `Reader is loading downloaded chapter data for chapter ${chapter.id}`
    );

    const pageUrls: string[] = await getChapterDownloadPath(series, chapter)
      .then((chapterPath: string) =>
        ipcRenderer.invoke(
          ipcChannels.EXTENSION.GET_PAGE_REQUESTER_DATA,
          FS_METADATA.id,
          SeriesSourceType.STANDARD,
          '',
          chapterPath
        )
      )
      .then((pageRequesterData: PageRequesterData) =>
        ipcRenderer.invoke(
          ipcChannels.EXTENSION.GET_PAGE_URLS,
          FS_METADATA.id,
          pageRequesterData
        )
      );
    props.setPageUrls(pageUrls);

    const curPageDataList: string[] = [];
    for (let i = 0; i < pageUrls.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await ipcRenderer
        .invoke(
          ipcChannels.EXTENSION.GET_PAGE_DATA,
          FS_METADATA.id,
          series,
          pageUrls[i]
        )
        .then((data: string) => {
          curPageDataList[i] = data;
          return props.setPageDataList([...curPageDataList]);
        });
      forceUpdate();
    }
  };

  /**
   * Populate the reader's props using the specified chapter.
   * Despite being async, you cannot guarantee that all of the props will be set when this function
   * resolves, since it does not wait for prop methods. However, it will eventually set all
   * necessary props for the reader to properly show the chapter.
   * @param chapterId the chapter to view. If it does not exist, this method returns immediately
   * @param seriesId the id of the series the chapter is from
   */
  const loadChapterData = async (chapterId: string, seriesId: string) => {
    log.debug(`Reader is loading chapter data for chapter ${chapterId}`);

    const chapter: Chapter | null = library.fetchChapter(seriesId, chapterId);
    const series: Series | null = library.fetchSeries(seriesId);
    if (chapter === null || series === null) return;

    if (props.relevantChapterList.length === 0) {
      createRelevantChapterList(series, chapter);
    }

    props.setSource(series, chapter);
    if (!chapter.read) props.toggleChapterRead(chapter, series);
    if (props.trackerAutoUpdate) props.sendProgressToTrackers(chapter, series);
    if (props.discordPresenceEnabled) {
      ipcRenderer.invoke(
        ipcChannels.INTEGRATION.DISCORD_SET_ACTIVITY,
        series,
        chapter
      );
    }

    if (await getChapterDownloaded(series, chapter)) {
      loadDownloadedChapterData(series, chapter);
      return;
    }

    const pageUrls: string[] = await ipcRenderer
      .invoke(
        ipcChannels.EXTENSION.GET_PAGE_REQUESTER_DATA,
        series.extensionId,
        series.sourceType,
        series.sourceId,
        chapter.sourceId
      )
      .then((pageRequesterData: PageRequesterData) =>
        ipcRenderer.invoke(
          ipcChannels.EXTENSION.GET_PAGE_URLS,
          series.extensionId,
          pageRequesterData
        )
      );
    props.setPageUrls(pageUrls);

    const curPageDataList: string[] = [];
    for (let i = 0; i < pageUrls.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await ipcRenderer
        .invoke(
          ipcChannels.EXTENSION.GET_PAGE_DATA,
          series.extensionId,
          series,
          pageUrls[i]
        )
        .then((data: string) => {
          curPageDataList[i] = data;
          return props.setPageDataList([...curPageDataList]);
        });
      forceUpdate();
    }
  };

  /**
   * Get the ID of a chapter just before or after the current one.
   * @param previous whether to get the previous chapter (instead of the next one)
   * @return the ID of the chapter, or null if none exists (or props.chapter or
   *  props.relevantChapterList have not been loaded)
   */
  const getAdjacentChapterId = (previous: boolean): string | null => {
    if (props.chapter === undefined) return null;

    const curChapterIndex: number = props.relevantChapterList.findIndex(
      (chapter: Chapter) => chapter.id === props.chapter?.id
    );
    const newChapterIndex = previous
      ? curChapterIndex + 1
      : curChapterIndex - 1;

    if (
      curChapterIndex === -1 ||
      newChapterIndex < 0 ||
      newChapterIndex >= props.relevantChapterList.length
    )
      return null;

    const id = props.relevantChapterList[newChapterIndex]?.id;
    return id === undefined ? null : id;
  };

  /**
   * Change to the specified chapter.
   * The chapter does not necessarily need to be included in relevantChapterList.
   * @param id the chapter id
   */
  const setChapter = (id: string) => {
    props.setPageNumber(1);
    props.setPageUrls([]);
    props.setPageDataList([]);

    loadChapterData(id, series_id);
  };

  /**
   * Change to an adjacent chapter.
   * Adjacent chapter is determined using getAdjacentChapterId. If not found, this method returns
   * without doing anything.
   * @param previous whether to get the previous chapter (as opposed to the next)
   * @return whether the chapter was actually changed or not
   */
  const changeChapter = (previous: boolean) => {
    const newChapterId = getAdjacentChapterId(previous);
    if (newChapterId === null) return false;
    setChapter(newChapterId);
    return true;
  };

  /**
   * Change the current viewed page.
   * Note that even when the user is viewing in two-page mode, they still always have a single
   * page number prop.
   * This method takes the current reader direction into account.
   * @param left whether to get the page to the left (as opposed to the right)
   * @param toBound whether to get the final page in this direction (i.e. the first or last page)
   */
  const changePage = (left: boolean, toBound = false) => {
    if (toBound) {
      if (
        props.layoutDirection === LayoutDirection.LeftToRight ||
        props.layoutDirection === LayoutDirection.Vertical
      ) {
        props.setPageNumber(left ? 1 : props.lastPageNumber);
      } else {
        props.setPageNumber(left ? props.lastPageNumber : 1);
      }
      return;
    }

    let delta = left ? -1 : 1;

    if (props.layoutDirection === LayoutDirection.RightToLeft) {
      delta = -delta;
    }
    if (props.pageView !== PageView.Single) {
      delta *= 2;
    }

    props.changePageNumber(delta);
  };

  /**
   * Remove all keybindings from the window.
   */
  const removeKeybindings = () => {
    Mousetrap.unbind(
      Object.values([
        props.keyPreviousPage,
        props.keyFirstPage,
        props.keyNextPage,
        props.keyLastPage,
        props.keyPreviousChapter,
        props.keyNextChapter,
        props.keyToggleLayoutDirection,
        props.keyTogglePageView,
        props.keyTogglePageFit,
        props.keyToggleShowingSettingsModal,
        props.keyToggleShowingSidebar,
        props.keyExit,
        props.keyCloseOrBack,
      ])
    );
  };

  /**
   * Exit the reader page.
   * If the series prop is loaded, go to its series detail page. Otherwise, go to the library.
   */
  const exitPage = () => {
    props.setPageNumber(1);
    props.setPageUrls([]);
    props.setPageDataList([]);
    props.setRelevantChapterList([]);
    removeKeybindings();

    if (props.discordPresenceEnabled) {
      ipcRenderer.invoke(ipcChannels.INTEGRATION.DISCORD_SET_ACTIVITY);
    }

    if (props.series !== undefined) {
      history.push(`${routes.SERIES}/${props.series.id}`);
    } else {
      history.push(routes.LIBRARY);
    }
  };

  /**
   * Add all keybindings to the window.
   * These need to be removed (with removeKeybindings) when changing to another page.
   */
  const addKeybindings = () => {
    Mousetrap.bind(props.keyPreviousPage, () => changePage(true));
    Mousetrap.bind(props.keyFirstPage, () => changePage(true, true));
    Mousetrap.bind(props.keyNextPage, () => changePage(false));
    Mousetrap.bind(props.keyLastPage, () => changePage(false, true));
    Mousetrap.bind(props.keyPreviousChapter, () => changeChapter(true));
    Mousetrap.bind(props.keyNextChapter, () => changeChapter(false));
    Mousetrap.bind(props.keyToggleLayoutDirection, () =>
      props.toggleLayoutDirection()
    );
    Mousetrap.bind(props.keyTogglePageView, () => props.togglePageView());
    Mousetrap.bind(props.keyTogglePageFit, () => props.togglePageFit());
    Mousetrap.bind(props.keyToggleShowingSettingsModal, () =>
      props.toggleShowingSettingsModal()
    );
    Mousetrap.bind(props.keyToggleShowingSidebar, () =>
      props.toggleShowingSidebar()
    );
    Mousetrap.bind(props.keyExit, () => exitPage());
    Mousetrap.bind(props.keyCloseOrBack, () => {
      if (!props.showingSidebar) props.toggleShowingSidebar();
      else exitPage();
    });
  };

  useEffect(() => {
    if (props.pageNumber > props.lastPageNumber && props.lastPageNumber !== 0) {
      const changed = changeChapter(false);
      if (!changed) props.setPageNumber(props.lastPageNumber);
    } else if (props.pageNumber <= 0) {
      const changed = changeChapter(true);
      if (!changed) props.setPageNumber(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pageNumber]);

  useEffect(() => {
    removeKeybindings();
    addKeybindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.showingSettingsModal]);

  useEffect(() => {
    addKeybindings();
    loadChapterData(chapter_id, series_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <Layout className={styles.pageLayout}>
      <ReaderSettingsModal />
      {props.showingSidebar ? (
        <ReaderSidebar
          changePage={changePage}
          setChapter={setChapter}
          changeChapter={changeChapter}
          getAdjacentChapterId={getAdjacentChapterId}
          exitPage={exitPage}
        />
      ) : (
        <></>
      )}
      <Layout className={`site-layout ${styles.contentLayout}`}>
        {props.pageDataList.length === 0 ? (
          <ReaderLoader extensionId={props.series?.extensionId} />
        ) : (
          <>
            <ReaderPreloadContainer />
            <ReaderViewer />
          </>
        )}
      </Layout>
    </Layout>
  );
};

export default connector(ReaderPage);
