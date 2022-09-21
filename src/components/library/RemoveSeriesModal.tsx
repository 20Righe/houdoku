import React, { useEffect, useState } from 'react';
import { Series } from 'houdoku-extension-lib';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { ipcRenderer } from 'electron';
import { Button, Checkbox, Group, Modal, Text } from '@mantine/core';
import ipcChannels from '../../constants/ipcChannels.json';
import routes from '../../constants/routes.json';
import { removeSeries } from '../../features/library/utils';
import { seriesListState } from '../../state/libraryStates';
import { confirmRemoveSeriesState, customDownloadsDirState } from '../../state/settingStates';

const defaultDownloadsDir = await ipcRenderer.invoke(ipcChannels.GET_PATH.DEFAULT_DOWNLOADS_DIR);

type Props = {
  series: Series | null;
  showing: boolean;
  close: () => void;
};

const RemoveSeriesModal: React.FC<Props> = (props: Props) => {
  const navigate = useNavigate();
  const [deleteDownloads, setDeleteDownloads] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const setSeriesList = useSetRecoilState(seriesListState);
  const [confirmRemoveSeries, setConfirmRemoveSeries] = useRecoilState(confirmRemoveSeriesState);
  const customDownloadsDir = useRecoilValue(customDownloadsDirState);

  const removeFunc = () => {
    if (props.series !== null) {
      removeSeries(
        props.series,
        setSeriesList,
        deleteDownloads,
        customDownloadsDir || defaultDownloadsDir
      );

      if (dontAskAgain) setConfirmRemoveSeries(false);
      navigate(routes.LIBRARY);
    }
    props.close();
  };

  useEffect(() => {
    setDeleteDownloads(false);
    setDontAskAgain(false);

    if (props.showing && !confirmRemoveSeries) {
      removeFunc();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.showing]);

  return (
    <Modal
      opened={props.showing && props.series !== null}
      centered
      title="Remove series"
      onClose={props.close}
    >
      <Text size="sm" mb="sm">
        Are you sure you want to remove{' '}
        <Text color="teal" inherit component="span" italic>
          {props.series?.title}
        </Text>{' '}
        from your library?
      </Text>
      <Checkbox
        label="Also delete downloaded chapters"
        checked={deleteDownloads}
        onChange={(e) => setDeleteDownloads(e.target.checked)}
      />
      <Checkbox
        mt="xs"
        label="Don't ask again"
        checked={dontAskAgain}
        onChange={(e) => setDontAskAgain(e.target.checked)}
      />
      <Group position="right" mt="sm">
        <Button variant="default" onClick={props.close}>
          Cancel
        </Button>
        <Button color="red" onClick={removeFunc}>
          Remove from library
        </Button>
      </Group>
    </Modal>
  );
};

export default RemoveSeriesModal;
