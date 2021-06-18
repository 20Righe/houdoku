/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import { Button, Col, Input, Row, Spin } from 'antd';
import Paragraph from 'antd/lib/typography/Paragraph';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import Title from 'antd/lib/typography/Title';
import styles from './TrackerSettings.css';
import ipcChannels from '../../constants/ipcChannels.json';
import storeKeys from '../../constants/storeKeys.json';
import persistantStore from '../../util/persistantStore';
import { AniListTrackerMetadata } from '../../services/trackers/anilist';

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

const TrackerSettings: React.FC<Props> = (props: Props) => {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [authUrl, setAuthUrl] = useState<string>('');
  const [username, setUsername] = useState<string | null>(null);

  const loadTrackerDetails = async () => {
    setLoading(true);

    await ipcRenderer
      .invoke(ipcChannels.TRACKER.GET_AUTH_URL, AniListTrackerMetadata.id)
      .then((_authUrl: string) => setAuthUrl(_authUrl))
      .catch((e) => log.error(e));

    await ipcRenderer
      .invoke(ipcChannels.TRACKER.GET_USERNAME, AniListTrackerMetadata.id)
      .then((_username) => setUsername(_username))
      .catch((e) => log.error(e));

    setLoading(false);
  };

  const saveTrackerDetails = async (_accessToken: string) => {
    setLoading(true);

    persistantStore.write(
      `${storeKeys.TRACKER_ACCESS_TOKEN_PREFIX}${AniListTrackerMetadata.id}`,
      _accessToken
    );
    await ipcRenderer
      .invoke(
        ipcChannels.TRACKER.SET_ACCESS_TOKEN,
        AniListTrackerMetadata.id,
        _accessToken
      )
      .catch((e) => log.error(e));
    loadTrackerDetails();
  };

  useEffect(() => {
    loadTrackerDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <Spin />
        <Paragraph>Reloading tracker details</Paragraph>
      </div>
    );
  }

  return (
    <>
      <Paragraph>
        Houdoku allows you to sync your account on list-tracking websites and
        automatically upload your progress as you read. After authenticating
        below, click the &quot;Trackers&quot; button on a series page to link it
        with an entry on your list.
      </Paragraph>
      <Title level={4}>AniList</Title>
      <Row className={styles.row}>
        <Col span={10}>1) Open the authentication page in your browser</Col>
        <Col span={14}>
          <Paragraph>
            <a href={authUrl} target="_blank" rel="noreferrer">
              {authUrl}
            </a>
          </Paragraph>
        </Col>
      </Row>
      <Row className={styles.row}>
        <Col span={10}>2) Copy the token you receive</Col>
        <Col span={14}>
          <Input
            value={accessToken}
            onChange={(e: any) => setAccessToken(e.target.value)}
          />
        </Col>
      </Row>
      <Row className={styles.row}>
        <Col span={10}>3) Save details</Col>
        <Col span={14}>
          <Button onClick={() => saveTrackerDetails(accessToken)}>
            Submit
          </Button>
        </Col>
      </Row>

      {username === null ? (
        <Paragraph className={styles.statusText}>
          You are not currently authenticated.
        </Paragraph>
      ) : (
        <Paragraph className={styles.statusText}>
          Authenticated as {username}.{' '}
          <a onClick={() => saveTrackerDetails('')}>Unlink</a>.
        </Paragraph>
      )}
    </>
  );
};

export default TrackerSettings;
