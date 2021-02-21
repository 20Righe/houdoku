/* eslint-disable promise/catch-or-return */
import React, { useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Link, Switch, Route, useHistory } from 'react-router-dom';
import { Layout, Menu, Button, Input, Slider } from 'antd';
import {
  BookOutlined,
  SearchOutlined,
  FileOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { RootState } from '../store';
import LibraryGrid from './LibraryGrid';
import {
  changeNumColumns,
  setFilter,
  setSeriesBannerUrl,
} from '../features/library/actions';
import { setStatusText } from '../features/statusbar/actions';
import SeriesDetails from './SeriesDetails';
import Search from './Search';
import StatusBar from './StatusBar';
import styles from './DashboardPage.css';
import routes from '../constants/routes.json';
import db from '../services/db';
import {
  loadChapterList,
  loadSeries,
  loadSeriesList,
} from '../features/library/utils';
import * as database from '../db';
import { Series, Chapter } from '../models/types';
import { getSeries, getChapters } from '../services/extension';
import { downloadCover } from '../util/download';
import Uploader from './Uploader';
import { getBannerImageUrl } from '../services/mediasource';
import Settings from './Settings';

const { Content, Sider } = Layout;
const { SubMenu } = Menu;

const mapState = (state: RootState) => ({
  seriesList: state.library.seriesList,
  series: state.library.series,
  chapterList: state.library.chapterList,
  columns: state.library.columns,
  filter: state.library.filter,
  seriesBannerUrl: state.library.seriesBannerUrl,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({
  changeNumColumns: (columns: number) => dispatch(changeNumColumns(columns)),
  setStatusText: (text?: string) => dispatch(setStatusText(text)),
  loadSeriesList: () => loadSeriesList(dispatch),
  loadSeries: (id: number) => loadSeries(dispatch, id),
  loadChapterList: (seriesId: number) => loadChapterList(dispatch, seriesId),
  setFilter: (filter: string) => dispatch(setFilter(filter)),
  setSeriesBannerUrl: (seriesBannerUrl: string | null) =>
    dispatch(setSeriesBannerUrl(seriesBannerUrl)),
});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

const DashboardPage: React.FC<Props> = (props: Props) => {
  const history = useHistory();

  useEffect(() => {
    database
      .init()
      .then(() => {
        props.loadSeriesList();
      })
      .catch((error) => console.log(error));
  }, []);

  const importSeries = async (extensionId: number, sourceId: string) => {
    const series: Series = await getSeries(extensionId, sourceId);
    const chapters: Chapter[] = await getChapters(extensionId, sourceId);

    const addResponse = await db.addSeries(series);
    await db.addChapters(chapters, addResponse[0]);
    await db.updateSeriesNumberUnread(addResponse[0]);
    props.loadSeriesList();
    downloadCover(addResponse[0]);
  };

  const goToSeries = (series: Series) => {
    if (series.id !== undefined) history.push(`${routes.SERIES}/${series.id}`);
  };

  return (
    <Layout className={styles.pageLayout}>
      <Sider className={styles.sider}>
        <div className="logo" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
          <Menu.Item key="1" icon={<BookOutlined />}>
            <Link to={routes.LIBRARY}>Library</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<SearchOutlined />}>
            <Link to={routes.SEARCH}>Search</Link>
          </Menu.Item>
          <Menu.Item key="3" icon={<SettingOutlined />}>
            <Link to={routes.SETTINGS}>Settings</Link>
          </Menu.Item>
          <SubMenu key="sub1" icon={<UserOutlined />} title="User">
            <Menu.Item key="4">Bill</Menu.Item>
            <Menu.Item key="5">Alex</Menu.Item>
          </SubMenu>
          <SubMenu key="sub2" icon={<TeamOutlined />} title="Team">
            <Menu.Item key="6">Team 1</Menu.Item>
            <Menu.Item key="8">Team 2</Menu.Item>
          </SubMenu>
          <Menu.Item key="9" icon={<FileOutlined />} />
        </Menu>
      </Sider>
      <Layout className={`site-layout ${styles.contentLayout}`}>
        <Content className={styles.content}>
          <Switch>
            <Route path={`${routes.SERIES}/:id`} exact>
              <SeriesDetails />
            </Route>
            <Route path={routes.SETTINGS} exact>
              <Settings />
            </Route>
            <Route path={routes.SEARCH} exact>
              <Search importSeries={importSeries} />
            </Route>
            <Route path={routes.LIBRARY}>
              <>
                <Button onClick={() => db.deleteAllSeries()}>
                  delete all series
                </Button>
                <Button onClick={() => props.loadSeriesList()}>
                  fetch series list
                </Button>
                <Button onClick={() => props.loadChapterList(1)}>
                  fetch chapter list
                </Button>
                <Button onClick={() => props.changeNumColumns(8)}>
                  update num columns
                </Button>
                <Button onClick={() => props.setStatusText('new status')}>
                  set status
                </Button>
                <Button onClick={() => importSeries(2, '9570')}>
                  import 9570
                </Button>
                <Button onClick={() => importSeries(1, 'aklsdj')}>
                  fs import
                </Button>
                <Button
                  onClick={async () => console.log(await getBannerImageUrl({}))}
                >
                  get banner
                </Button>
                <hr />
                <div className={styles.controlBar}>
                  <div className={styles.controlBarSpacer} />
                  <Slider
                    className={styles.columnsSlider}
                    min={2}
                    max={8}
                    step={2}
                    value={props.columns}
                    marks={{ 2: '2', 4: '4', 6: '6', 8: '8' }}
                    onChange={(value: number) => props.changeNumColumns(value)}
                  />
                  <Input
                    className={styles.seriesFilter}
                    placeholder="Filter series list..."
                    onChange={(e) => props.setFilter(e.target.value)}
                  />
                </div>
                <Uploader callback={(path: string) => importSeries(1, path)} />
              </>
              <p>{props.filter}</p>
              <LibraryGrid
                columns={props.columns}
                seriesList={props.seriesList}
                filter={props.filter}
                clickFunc={goToSeries}
              />
            </Route>
          </Switch>
        </Content>
      </Layout>
      <StatusBar />
    </Layout>
  );
};

export default connector(DashboardPage);
