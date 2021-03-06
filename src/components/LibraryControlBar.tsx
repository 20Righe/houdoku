/* eslint-disable react/jsx-boolean-value */
import React, { useState } from 'react';
import { Button, Slider, Input, Dropdown, Menu, Popover } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { Header } from 'antd/lib/layout/layout';
import { connect, ConnectedProps } from 'react-redux';
import styles from './LibraryControlBar.css';
import {
  changeNumColumns,
  setFilter,
  setFilterProgress,
  setFilterStatus,
} from '../features/library/actions';
import { loadSeriesList, reloadSeriesList } from '../features/library/utils';
import { setStatusText } from '../features/statusbar/actions';
import { RootState } from '../store';
import { ProgressFilter, SeriesStatus } from '../models/types';

const mapState = (state: RootState) => ({
  seriesList: state.library.seriesList,
  columns: state.library.columns,
  filter: state.library.filter,
  filterStatus: state.library.filterStatus,
  filterProgress: state.library.filterProgress,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  changeNumColumns: (columns: number) => dispatch(changeNumColumns(columns)),
  setStatusText: (text?: string) => dispatch(setStatusText(text)),
  loadSeriesList: () => loadSeriesList(dispatch),
  setFilter: (filter: string) => dispatch(setFilter(filter)),
  setFilterStatus: (status: SeriesStatus | null) =>
    dispatch(setFilterStatus(status)),
  setFilterProgress: (unread: boolean) => dispatch(setFilterProgress(unread)),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

const LibraryControlBar: React.FC<Props> = (props: Props) => {
  const [showingColumnsPopover, setShowingColumnsPopover] = useState(false);

  const getFilterStatusText = () => {
    const status = props.filterStatus;

    let valueText = '';
    if (status === null) valueText = 'Any';
    else if (status === SeriesStatus.ONGOING) valueText = 'Ongoing';
    else if (status === SeriesStatus.COMPLETED) valueText = 'Completed';
    else if (status === SeriesStatus.CANCELLED) valueText = 'Cancelled';
    return `Release Status: ${valueText}`;
  };

  const getFilterProgressText = () => {
    const prefix = 'Showing: ';

    if (props.filterProgress === ProgressFilter.All) return `${prefix}All`;
    if (props.filterProgress === ProgressFilter.Unread)
      return `${prefix}Unread`;
    if (props.filterProgress === ProgressFilter.Finished)
      return `${prefix}Finished`;
    return prefix;
  };

  return (
    <>
      <Header className={styles.header}>
        <Button
          className={styles.reloadButton}
          onClick={() =>
            reloadSeriesList(
              props.seriesList,
              props.setStatusText,
              props.loadSeriesList
            )
          }
        >
          Refresh All Series
        </Button>
        <div className={styles.controlBarSpacer} />
        <Popover
          content={
            <Slider
              className={styles.columnsSlider}
              min={2}
              max={8}
              step={2}
              value={props.columns}
              onChange={(value: number) => props.changeNumColumns(value)}
            />
          }
          title="Change number of columns"
          trigger="click"
          visible={showingColumnsPopover}
          onVisibleChange={(visible: boolean) =>
            setShowingColumnsPopover(visible)
          }
        >
          <Button>Columns</Button>
        </Popover>
        <Dropdown
          overlay={
            <Menu
              onClick={(e) =>
                props.setFilterProgress(e.item.props['data-value'])
              }
            >
              <Menu.Item
                key={ProgressFilter.All}
                data-value={ProgressFilter.All}
              >
                All
              </Menu.Item>
              <Menu.Item
                key={ProgressFilter.Unread}
                data-value={ProgressFilter.Unread}
              >
                Unread
              </Menu.Item>
              <Menu.Item
                key={ProgressFilter.Finished}
                data-value={ProgressFilter.Finished}
              >
                Finished
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            {getFilterProgressText()} <DownOutlined />
          </Button>
        </Dropdown>
        <Dropdown
          overlay={
            <Menu
              onClick={(e) => props.setFilterStatus(e.item.props['data-value'])}
            >
              <Menu.Item key={null} data-value={null}>
                Any
              </Menu.Item>
              <Menu.Item
                key={SeriesStatus.ONGOING}
                data-value={SeriesStatus.ONGOING}
              >
                Ongoing
              </Menu.Item>
              <Menu.Item
                key={SeriesStatus.COMPLETED}
                data-value={SeriesStatus.COMPLETED}
              >
                Completed
              </Menu.Item>
              <Menu.Item
                key={SeriesStatus.CANCELLED}
                data-value={SeriesStatus.CANCELLED}
              >
                Cancelled
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            {getFilterStatusText()} <DownOutlined />
          </Button>
        </Dropdown>
        <Input
          className={styles.seriesFilter}
          placeholder="Filter series list..."
          onChange={(e) => props.setFilter(e.target.value)}
        />
      </Header>
    </>
  );
};

export default connector(LibraryControlBar);
