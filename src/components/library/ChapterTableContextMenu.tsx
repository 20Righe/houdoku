/* eslint-disable react/button-has-type */
/* eslint-disable react/display-name */
import React from 'react';
import {
  CaretRightOutlined,
  CheckOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Chapter, Series } from 'houdoku-extension-lib';
import { connect, ConnectedProps } from 'react-redux';
import { ipcRenderer } from 'electron';
import { useHistory } from 'react-router-dom';
import styles from './ChapterTableContextMenu.css';
import { downloadChapters } from '../../features/downloader/actions';
import { DownloadTask } from '../../services/downloader';
import { RootState } from '../../store';
import { toggleChapterRead } from '../../features/library/utils';
import { getChapterDownloadedSync } from '../../util/filesystem';
import routes from '../../constants/routes.json';
import ipcChannels from '../../constants/ipcChannels.json';

const downloadsDir = await ipcRenderer.invoke(
  ipcChannels.GET_PATH.DOWNLOADS_DIR
);

const WIDTH = 140;
const HEIGHT = 150;

const mapState = (state: RootState) => ({
  queue: state.downloader.queue,
  currentTask: state.downloader.currentTask,
  downloadErrors: state.downloader.downloadErrors,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  downloadChapters: (tasks: DownloadTask[]) =>
    dispatch(downloadChapters(tasks)),
  toggleChapterRead: (chapter: Chapter, series: Series) =>
    toggleChapterRead(dispatch, chapter, series),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  location: { x: number; y: number };
  visible: boolean;
  series: Series;
  chapter: Chapter | undefined;
  chapterList: Chapter[];
  close: () => void;
};

const ChapterTableContextMenu: React.FC<Props> = (props: Props) => {
  const history = useHistory();

  if (!props.visible) return <></>;

  const getPreviousChapters = () => {
    return props.chapterList.filter((chapter: Chapter) => {
      return (
        props.chapter !== undefined &&
        parseFloat(chapter.chapterNumber) <
          parseFloat(props.chapter.chapterNumber)
      );
    });
  };

  const safeDownloadChapters = (chapters: Chapter[]) => {
    const queue: Chapter[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const chapter of chapters) {
      if (!getChapterDownloadedSync(props.series, chapter, downloadsDir)) {
        queue.push(chapter);
      }
    }
    props.downloadChapters(
      queue.map(
        (chapter: Chapter) =>
          ({ chapter, series: props.series } as DownloadTask)
      )
    );
  };

  const handleDownload = () => {
    props.close();
    if (props.chapter !== undefined) {
      props.downloadChapters([
        { chapter: props.chapter, series: props.series } as DownloadTask,
      ]);
    }
  };

  const handleDownloadPrevious = () => {
    props.close();
    safeDownloadChapters(getPreviousChapters());
  };

  const handleDownloadAll = () => {
    props.close();
    safeDownloadChapters(props.chapterList);
  };

  const handleRead = () => {
    props.close();
    if (props.chapter !== undefined) {
      history.push(`${routes.READER}/${props.chapter.id}`);
    }
  };

  const handleToggleRead = () => {
    props.close();
    if (props.chapter !== undefined) {
      props.toggleChapterRead(props.chapter, props.series);
    }
  };

  const handleMarkPreviousRead = () => {
    props.close();
    getPreviousChapters().forEach((chapter: Chapter) => {
      if (!chapter.read) {
        props.toggleChapterRead(chapter, props.series);
      }
    });
  };

  // eslint-disable-next-line prefer-const
  let { x, y } = props.location;
  if (props.location.x + WIDTH > window.innerWidth) {
    x = props.location.x - WIDTH;
  }
  if (props.location.y + HEIGHT > window.innerHeight) {
    y = props.location.y - HEIGHT;
  }

  return (
    <div
      className={styles.container}
      style={{
        width: WIDTH,
        left: x,
        top: y,
      }}
    >
      <button className={styles.button} onClick={() => handleRead()}>
        <CaretRightOutlined /> Read
      </button>
      <button className={styles.button} onClick={() => handleToggleRead()}>
        <CheckOutlined /> Toggle read
      </button>
      <button
        className={styles.button}
        onClick={() => handleMarkPreviousRead()}
      >
        Mark previous read
      </button>
      <hr className={styles.divider} />
      <button className={styles.button} onClick={() => handleDownload()}>
        <DownloadOutlined /> Download
      </button>
      <button
        className={styles.button}
        onClick={() => handleDownloadPrevious()}
      >
        Download previous
      </button>
      <button className={styles.button} onClick={() => handleDownloadAll()}>
        Download all
      </button>
    </div>
  );
};

export default connector(ChapterTableContextMenu);
