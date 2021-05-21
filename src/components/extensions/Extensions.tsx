import React, { useEffect, useState } from 'react';
import aki, { RegistrySearchResults } from 'aki-plugin-manager';
import { Row, Button, Spin, Input } from 'antd';
import log from 'electron-log';
import { SearchOutlined } from '@ant-design/icons';
import { connect, ConnectedProps } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Paragraph from 'antd/lib/typography/Paragraph';
import Title from 'antd/lib/typography/Title';
import styles from './Extensions.css';
import { RootState } from '../../store';
import ExtensionTable from './ExtensionTable';
import InstalledExtensionsModal from './InstalledExtensionsModal';

const mapState = (state: RootState) => ({
  chapterLanguages: state.settings.chapterLanguages,
  refreshOnStart: state.settings.refreshOnStart,
  pageFit: state.settings.pageFit,
  pageView: state.settings.pageView,
  layoutDirection: state.settings.layoutDirection,
  preloadAmount: state.settings.preloadAmount,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatch = (dispatch: any) => ({});

const connector = connect(mapState, mapDispatch);
type PropsFromRedux = ConnectedProps<typeof connector>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = PropsFromRedux & {};

const Extensions: React.FC<Props> = (props: Props) => {
  const [searchResults, setSearchResults] = useState<RegistrySearchResults>();
  const [filterText, setFilterText] = useState('');
  const [showingModal, setShowingModal] = useState(false);
  const location = useLocation();

  const doSearchRegistry = () => {
    log.debug(`Searching extension registry...`);

    setSearchResults(undefined);
    aki
      .search({ text: 'extension', scope: 'houdoku' })
      .then((results: RegistrySearchResults) => {
        log.debug(`Extension registry search found ${results.total} results`);
        return setSearchResults(results);
      })
      .catch((e) => log.error(e));
  };

  useEffect(() => {
    doSearchRegistry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <>
      <InstalledExtensionsModal
        visible={showingModal}
        toggleVisible={() => setShowingModal(!showingModal)}
      />
      <Title className={styles.title} level={4}>
        Extensions
      </Title>
      <Row className={styles.row}>
        <Button
          className={styles.reloadButton}
          onClick={() => doSearchRegistry()}
        >
          Refresh Extension List
        </Button>
        <Button onClick={() => setShowingModal(true)}>
          View Installed Extensions
        </Button>
        <div className={styles.spacer} />
        <Input
          className={styles.filterInput}
          placeholder="Filter extensions..."
          suffix={<SearchOutlined />}
          onChange={(e: any) => setFilterText(e.target.value)}
        />
      </Row>
      {searchResults === undefined ? (
        <div className={styles.loadingContainer}>
          <Spin />
          <Paragraph>Loading extension list...</Paragraph>
          <Paragraph>This requires an internet connection.</Paragraph>
        </div>
      ) : (
        <ExtensionTable
          registryResults={searchResults}
          filterText={filterText}
        />
      )}
    </>
  );
};

export default connector(Extensions);
