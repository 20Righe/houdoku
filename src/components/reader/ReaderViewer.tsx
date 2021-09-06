/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Layout } from 'antd';
import Paragraph from 'antd/lib/typography/Paragraph';
import { RootState } from '../../store';
import styles from './ReaderViewer.css';
import { LayoutDirection, PageFit, PageView } from '../../models/types';
import { changePageNumber } from '../../features/reader/actions';

const { Content } = Layout;

const mapState = (state: RootState) => ({
  pageNumber: state.reader.pageNumber,
  lastPageNumber: state.reader.lastPageNumber,
  pageDataList: state.reader.pageDataList,
  series: state.reader.series,
  showingSidebar: state.reader.showingSidebar,
  pageFit: state.settings.pageFit,
  pageView: state.settings.pageView,
  layoutDirection: state.settings.layoutDirection,
  overlayPageNumber: state.settings.overlayPageNumber,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  changePageNumber: (delta: number) => dispatch(changePageNumber(delta)),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

const ReaderViewer: React.FC<Props> = (props: Props) => {
  const getPageMargin = () => {
    return props.layoutDirection === LayoutDirection.Vertical
      ? 0
      : `${props.pageNumber * -100 + 100}%`;
  };

  const viewerContainerClickHandler = (e: any) => {
    const rect: DOMRect = e.target.getBoundingClientRect();
    const relX = e.clientX - rect.left;

    if (relX > rect.width * 0.6) {
      props.changePageNumber(
        props.layoutDirection === LayoutDirection.LeftToRight ? 1 : -1
      );
    } else if (relX < rect.width * 0.4) {
      props.changePageNumber(
        props.layoutDirection === LayoutDirection.LeftToRight ? -1 : 1
      );
    }
  };

  const renderPageImage = (pageNumber: number) => {
    if (props.series === undefined) return <></>;
    if (props.pageDataList.length === 0) return <></>;

    return pageNumber <= props.lastPageNumber && pageNumber > 0 ? (
      <img
        className={styles.pageImage}
        src={props.pageDataList[pageNumber - 1]}
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

  const renderViewer = () => {
    const imageWrappers = [];

    for (let i = 1; i <= props.lastPageNumber; i += 1) {
      imageWrappers.push(
        <Content
          key={i}
          className={`${styles.imageWrapper}
            ${props.pageFit === PageFit.Auto ? styles.fitAuto : ''}
            ${props.pageFit === PageFit.Width ? styles.fitWidth : ''}
            ${props.pageFit === PageFit.Height ? styles.fitHeight : ''}
          `}
          style={{ marginLeft: i === 1 ? getPageMargin() : 0 }}
        >
          {props.pageView === PageView.Single ||
          props.layoutDirection === LayoutDirection.Vertical
            ? renderPageImage(i)
            : renderTwoPageLayout(i)}
        </Content>
      );
    }

    return (
      <div
        className={
          props.layoutDirection === LayoutDirection.Vertical
            ? styles.viewerContainerVertical
            : styles.viewerContainer
        }
        onClick={
          LayoutDirection.Vertical ? () => {} : viewerContainerClickHandler
        }
      >
        {imageWrappers}
      </div>
    );
  };

  const renderPageNumberOverlay = () => {
    return (
      <div className={styles.pageNumberOverlayContainer}>
        <Paragraph className={styles.pageNumberOverlayText}>
          {props.pageNumber}/{props.lastPageNumber}
        </Paragraph>
      </div>
    );
  };

  return (
    <>
      {props.overlayPageNumber ? renderPageNumberOverlay() : <></>}
      {renderViewer()}
    </>
  );
};

export default connector(ReaderViewer);
