import React, { useEffect, useState } from 'react';
import { Button, Modal, Row, Spin } from 'antd';
import Paragraph from 'antd/lib/typography/Paragraph';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { Series } from 'houdoku-extension-lib';
import { useRecoilState, useSetRecoilState } from 'recoil';
import styles from './AddSeriesModal.css';
import ipcChannels from '../../constants/ipcChannels.json';
import SeriesEditControls from '../general/SeriesEditControls';
import { importSeries } from '../../features/library/utils';
import library from '../../services/library';
import { downloadCover } from '../../util/download';
import { seriesListState } from '../../state/libraryStates';
import { statusTextState } from '../../state/statusBarStates';

type Props = {
  series: Series | undefined;
  visible: boolean;
  editable: boolean | undefined;
  toggleVisible: () => void;
};

const AddSeriesModal: React.FC<Props> = (props: Props) => {
  const [, setSeriesList] = useRecoilState(seriesListState);
  const setStatusText = useSetRecoilState(statusTextState);
  const [customSeries, setCustomSeries] = useState<Series>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    if (props.series !== undefined) {
      // we can't guarantee the provided series has all of the available fields (since
      // they are not usually included in the search results) so we explicitly retrieve
      // all of the series data here

      log.debug(
        `AddSeriesModal is retrieving details for series ${props.series.sourceId} from extension ${props.series.extensionId}`
      );
      ipcRenderer
        .invoke(
          ipcChannels.EXTENSION.GET_SERIES,
          props.series.extensionId,
          props.series.sourceType,
          props.series.sourceId
        )
        .then((series?: Series) => {
          if (series !== undefined) {
            log.debug(
              `AddSeriesModal found matching series ${series?.sourceId}`
            );
            setCustomSeries(series);
          }
          return series;
        })
        .finally(() => setLoading(false))
        .catch((e) => log.error(e));
    }
  }, [props.series]);

  const handleAdd = () => {
    if (customSeries !== undefined) {
      importSeries(customSeries, setStatusText)
        // eslint-disable-next-line promise/always-return
        .then((addedSeries) => {
          setSeriesList(library.fetchSeriesList());
          downloadCover(addedSeries);
        })
        .catch((e) => log.error(e));
      props.toggleVisible();
    }
  };

  if (loading || customSeries === undefined) {
    return (
      <Modal
        title="Add Series to Library"
        visible={props.visible}
        footer={null}
        onCancel={props.toggleVisible}
      >
        <div className={styles.loaderContainer}>
          <Spin />
          <Paragraph>Loading series details...</Paragraph>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Add Series to Library"
      visible={props.visible}
      footer={null}
      onCancel={props.toggleVisible}
    >
      <SeriesEditControls
        series={customSeries}
        setSeries={(series: Series) => setCustomSeries(series)}
        editable={props.editable === true}
      />
      <Row className={styles.buttonRow}>
        <Button className={styles.button} onClick={handleAdd}>
          Add Series
        </Button>
      </Row>
    </Modal>
  );
};

export default AddSeriesModal;
