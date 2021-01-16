/* eslint-disable jsx-a11y/control-has-associated-label */
/* eslint-disable react/button-has-type */
/* eslint-disable consistent-return */
/* eslint-disable promise/catch-or-return */
import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Link, Switch, Route, useParams } from 'react-router-dom';
import { Layout, Typography, Button, Row, Col, Slider, Tooltip } from 'antd';
import { RootState } from '../store';
import {
  changePageNumber,
  setPageFit,
  setPageNumber,
  setPageUrls,
  setPreloadAmount,
  toggleLayoutDirection,
  togglePageFit,
  togglePageView,
  setSource,
  setChapterIdList,
} from '../reader/actions';
import styles from './ReaderPage.css';
import routes from '../constants/routes.json';
import {
  Chapter,
  LayoutDirection,
  PageFit,
  PageView,
  Series,
} from '../models/types';
import { loadChapter } from '../datastore/utils';
import { getPageRequesterData, getPageUrls } from '../services/extension';
import { PageRequesterData } from '../services/extensions/types';
import db from '../services/db';
import { selectMostSimilarChapter } from '../util/comparison';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const mapState = (state: RootState) => ({
  pageNumber: state.reader.pageNumber,
  lastPageNumber: state.reader.lastPageNumber,
  pageFit: state.reader.pageFit,
  pageView: state.reader.pageView,
  layoutDirection: state.reader.layoutDirection,
  preloadAmount: state.reader.preloadAmount,
  pageUrls: state.reader.pageUrls,
  series: state.reader.series,
  chapter: state.reader.chapter,
  chapterIdList: state.reader.chapterIdList,
  createdChapterIdList: state.reader.createdChapterIdList,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  fetchChapter: (id: number) => loadChapter(dispatch, id),
  setPageNumber: (pageNumber: number) => dispatch(setPageNumber(pageNumber)),
  changePageNumber: (delta: number) => dispatch(changePageNumber(delta)),
  setPageFit: (pageFit: PageFit) => dispatch(setPageFit(pageFit)),
  togglePageFit: () => dispatch(togglePageFit()),
  togglePageView: () => dispatch(togglePageView()),
  toggleLayoutDirection: () => dispatch(toggleLayoutDirection()),
  setPreloadAmount: (preloadAmount: number) =>
    dispatch(setPreloadAmount(preloadAmount)),
  setPageUrls: (pageUrls: string[]) => dispatch(setPageUrls(pageUrls)),
  setSource: (series?: Series, chapter?: Chapter) =>
    dispatch(setSource(series, chapter)),
  setChapterIdList: (chapterIdList: number[]) =>
    dispatch(setChapterIdList(chapterIdList)),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

const ReaderPage: React.FC<Props> = (props: Props) => {
  const { chapter_id } = useParams();

  const createChapterIdList = async (series: Series, chapter: Chapter) => {
    if (series.id === undefined) return;

    const chapterIdList: number[] = [];

    const chapters: Chapter[] = await db.fetchChapters(series.id);

    const chapterNumbers: Set<string> = new Set();
    chapters.forEach((c: Chapter) => chapterNumbers.add(c.chapterNumber));

    chapterNumbers.forEach((chapterNumber: string) => {
      const curChapters: Chapter[] = chapters.filter(
        (c: Chapter) => c.chapterNumber === chapterNumber
      );

      const bestMatch: Chapter | null = selectMostSimilarChapter(
        chapter,
        curChapters
      );
      if (bestMatch !== null && bestMatch.id !== undefined) {
        chapterIdList.push(bestMatch.id);
      }
    });

    props.setChapterIdList(chapterIdList);
  };

  const loadChapterData = async (chapterId: number) => {
    const chapter: Chapter = await db
      .fetchChapter(chapterId)
      .then((response: any) => response[0]);

    if (chapter.seriesId === undefined) return;
    const series: Series = await db
      .fetchSeries(chapter.seriesId)
      .then((response: any) => response[0]);

    props.setSource(series, chapter);
    if (!props.createdChapterIdList) createChapterIdList(series, chapter);

    const pageUrls: string[] = await getPageRequesterData(
      series.extensionId,
      chapter.sourceId
    ).then((pageRequesterData: PageRequesterData) =>
      getPageUrls(series.extensionId, pageRequesterData)
    );
    props.setPageUrls(pageUrls);
  };

  const getPageMargin = () => {
    return `${props.pageNumber * -100 + 100}%`;
  };

  const getPageFitClass = () => {
    if (props.pageFit === PageFit.Auto) {
      return styles.auto;
    }
    if (props.pageFit === PageFit.Width) {
      return styles.width;
    }
    return styles.height;
  };

  const getPageViewClass = () => {
    if (props.pageView === PageView.Single) {
      return styles.single;
    }
    if (props.pageView === PageView.Double) {
      return styles.double;
    }
    return styles.doubleOdd;
  };

  const getLayoutDirectionClass = () => {
    if (props.layoutDirection === LayoutDirection.LeftToRight) {
      return styles.leftToRight;
    }
    return styles.rightToLeft;
  };

  useEffect(() => {
    props.fetchChapter(chapter_id);
    loadChapterData(chapter_id);
  }, []);

  const renderPageImage = (pageNumber: number) => {
    if (props.pageUrls.length === 0) return;

    return pageNumber <= props.lastPageNumber && pageNumber > 0 ? (
      <img
        className={styles.pageImage}
        src={props.pageUrls[pageNumber - 1]}
        alt={`page${pageNumber}`}
        loading="lazy"
      />
    ) : (
      <img className={styles.pageImage} src="data:," alt="" />
    );
  };

  const renderTwoPageLayout = (pageNumber: number) => {
    const firstPageNumber =
      props.pageView === PageView.Double_OddStart ? pageNumber - 1 : pageNumber;
    return (
      <>
        <span className={styles.imageColumn}>
          {renderPageImage(
            props.layoutDirection === LayoutDirection.LeftToRight
              ? firstPageNumber
              : firstPageNumber + 1
          )}
        </span>
        <span className={styles.imageColumn}>
          {renderPageImage(
            props.layoutDirection === LayoutDirection.LeftToRight
              ? firstPageNumber + 1
              : firstPageNumber
          )}
        </span>
      </>
    );
  };

  const renderPreloadContainer = (pageNumber: number) => {
    if (props.pageUrls.length === 0) return;

    const images = [];

    for (
      let i = pageNumber;
      i < props.lastPageNumber && i < pageNumber + props.preloadAmount;
      i += 1
    ) {
      images.push(<img src={props.pageUrls[i]} alt="pagepreload" key={i} />);
    }

    return <div className={styles.preloadContainer}>{images}</div>;
  };

  const renderViewer = () => {
    const imageWrappers = [];

    for (let i = 1; i <= props.lastPageNumber; i += 1) {
      imageWrappers.push(
        <Content
          className={`${styles.imageWrapper}
            ${props.pageFit === PageFit.Auto ? styles.fitAuto : ''}
            ${props.pageFit === PageFit.Width ? styles.fitWidth : ''}
            ${props.pageFit === PageFit.Height ? styles.fitHeight : ''}
          `}
          style={{ marginLeft: i === 1 ? getPageMargin() : 0 }}
        >
          {props.pageView === PageView.Single
            ? renderPageImage(i)
            : renderTwoPageLayout(i)}
        </Content>
      );
    }

    return <div className={styles.viewerContainer}>{imageWrappers}</div>;
  };

  const changePage = (left: boolean, toBound = false) => {
    if (toBound) {
      if (props.layoutDirection === LayoutDirection.LeftToRight) {
        props.setPageNumber(left ? 0 : props.lastPageNumber);
      } else {
        props.setPageNumber(left ? props.lastPageNumber : 0);
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

  const changeChapter = (left: boolean) => {
    if (props.chapter === undefined) return;

    const curChapterIndex: number = props.chapterIdList.findIndex(
      (id: number) => id === props.chapter.id
    );

    const newChapterId: number =
      props.chapterIdList[left ? curChapterIndex + 1 : curChapterIndex - 1];
    loadChapterData(newChapterId);
  };

  const preloadSliderMarks: { [key: number]: string } = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '∞',
  };

  const preloadSliderTipFormatter = (value?: number): string => {
    if (value === undefined) {
      return '';
    }
    return preloadSliderMarks[value];
  };

  if (props.pageUrls.length === 0) {
    return <p>loading...</p>;
  }

  return (
    <Layout className={styles.pageLayout}>
      <Sider className={styles.sider}>
        <div className={styles.siderHeader}>
          <button className={styles.exitButton} />
          <Title className={styles.seriesTitle} level={4}>
            {props.series === undefined ? 'loading...' : props.series.title}
          </Title>
        </div>
        <div className={styles.chapterHeader}>
          <button
            className={`${styles.chapterButton} ${styles.prev}`}
            onClick={() => changeChapter(true)}
          />
          <Text className={styles.chapterName}>
            {props.chapter === undefined
              ? 'loading...'
              : `${props.chapter.chapterNumber} - ${props.chapter.title}`}
          </Text>
          <button
            className={`${styles.chapterButton} ${styles.next}`}
            onClick={() => changeChapter(false)}
          />
        </div>
        <div className={styles.settingsBar}>
          <button
            className={`${styles.settingsButton} ${styles.start}`}
            onClick={() => props.setPageNumber(1)}
          />
          <Tooltip title="Change page fit">
            <button
              className={`${styles.settingsButton}
                        ${styles.fit} ${getPageFitClass()}`}
              onClick={() => props.togglePageFit()}
            />
          </Tooltip>
          <Tooltip title="Change two-page view">
            <button
              className={`${styles.settingsButton}
                        ${styles.pageView} ${getPageViewClass()}`}
              onClick={() => props.togglePageView()}
            />
          </Tooltip>
          <Tooltip title="Change reader direction">
            <button
              className={`${styles.settingsButton}
                        ${styles.layoutDirection} ${getLayoutDirectionClass()}`}
              onClick={() => props.toggleLayoutDirection()}
            />
          </Tooltip>
          <button
            className={`${styles.settingsButton} ${styles.end}`}
            onClick={() => props.setPageNumber(props.lastPageNumber)}
          />
        </div>
        <div className={styles.pageControlBar}>
          <button
            className={`${styles.pageButton} ${styles.start}`}
            onClick={() => changePage(true, true)}
          />
          <button
            className={`${styles.pageButton} ${styles.prev}`}
            onClick={() => changePage(true)}
          />
          <Text className={styles.pageNumber}>
            {`${props.pageNumber} / ${props.lastPageNumber}`}
          </Text>
          <button
            className={`${styles.pageButton} ${styles.next}`}
            onClick={() => changePage(false)}
          />
          <button
            className={`${styles.pageButton} ${styles.end}`}
            onClick={() => changePage(false, true)}
          />
        </div>
        <p>Fit is: {props.pageFit}</p>
        <p>{chapter_id}</p>
        <Button onClick={() => props.togglePageFit()}>change fit</Button>
        <p>{`cur_page=${props.pageNumber} last_page=${props.lastPageNumber}`}</p>
        <p>{`page_view=${props.pageView}`}</p>
        <p>{`layout_dir=${props.layoutDirection}`}</p>
        <p>{`preload=${props.preloadAmount}`}</p>
        <p>{props.chapter?.groupName}</p>
        <Slider
          min={0}
          max={10}
          marks={preloadSliderMarks}
          tipFormatter={(value?: number) => preloadSliderTipFormatter(value)}
          defaultValue={props.preloadAmount}
          onChange={(value: number) => props.setPreloadAmount(value)}
        />
        <Button onClick={() => changePage(true)}>left</Button>
        <Button onClick={() => changePage(false)}>right</Button>
        <Button onClick={() => props.toggleLayoutDirection()}>
          toggle layout direction
        </Button>
        <Link to={routes.LIBRARY}>
          <Button>back to library</Button>
        </Link>
      </Sider>
      <Layout className={`site-layout ${styles.contentLayout}`}>
        {renderPreloadContainer(props.pageNumber)}
        {renderViewer()}
      </Layout>
    </Layout>
  );
};

export default connector(ReaderPage);
