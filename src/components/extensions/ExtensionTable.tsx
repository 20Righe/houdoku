import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';
import log from 'electron-log';
import { Table, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { RegistrySearchResults, RegistrySearchPackage } from 'aki-plugin-manager';
import { gt } from 'semver';
import { ExtensionMetadata, LanguageKey, Languages } from 'houdoku-extension-lib';
import { useSetRecoilState } from 'recoil';
import { ExtensionTableRow } from '../../models/types';
import ipcChannels from '../../constants/ipcChannels.json';
import flags from '../../img/flags.png';
import { statusTextState } from '../../state/statusBarStates';

type Props = {
  registryResults: RegistrySearchResults;
  filterText: string;
  showExtensionSettingsModal: (extensionId: string) => void;
};

const ExtensionTable: React.FC<Props> = (props: Props) => {
  const [dataSource, setDataSource] = useState<ExtensionTableRow[]>([]);
  const [extensionLanguageKeys, setExtensionLanguageKeys] = useState<{
    [languageKey: string]: number;
  }>({});
  const setStatusText = useSetRecoilState(statusTextState);

  const updateDataSource = async () => {
    if (props.registryResults === undefined) {
      setDataSource([]);
      setExtensionLanguageKeys({});
      return;
    }

    const metadataList: ExtensionMetadata[] = await ipcRenderer.invoke(
      ipcChannels.EXTENSION_MANAGER.GET_ALL
    );

    const newExtensionLanguageKeys: { [languageKey: string]: number } = {};
    setDataSource(
      props.registryResults.objects
        .map((object: any) => {
          const pkg: RegistrySearchPackage = object.package;
          const description = JSON.parse(pkg.description);

          let installedVersion;
          let canUpdate = false;
          const metadata = metadataList.find(
            (_metadata: ExtensionMetadata) => _metadata.id === description.id
          );
          if (metadata !== undefined) {
            installedVersion = metadata.version;
            canUpdate = gt(pkg.version, installedVersion);
          }

          const languageKey =
            !('translatedLanguage' in description) || description.translatedLanguage === ''
              ? undefined
              : description.translatedLanguage;

          if (languageKey !== undefined) {
            newExtensionLanguageKeys[languageKey] =
              languageKey in newExtensionLanguageKeys
                ? newExtensionLanguageKeys[languageKey] + 1
                : 1;
          }

          return {
            pkgName: pkg.name,
            friendlyName: description.name,
            id: description.id,
            availableVersion: pkg.version,
            url: description.url,
            languageKey,
            installedVersion,
            canUpdate,
            hasSettings: metadata ? metadata.hasSettings : false,
          };
        })
        .filter((row: ExtensionTableRow) => {
          if (props.filterText === '') return true;
          return (
            row.friendlyName.toLowerCase().includes(props.filterText.toLowerCase()) ||
            row.url.toLowerCase().includes(props.filterText.toLowerCase())
          );
        })
        .sort((a: ExtensionTableRow, b: ExtensionTableRow) => {
          if (a.installedVersion !== undefined) {
            if (b.installedVersion !== undefined) {
              return a.pkgName.localeCompare(b.pkgName);
            }
            return -1;
          }
          if (b.installedVersion !== undefined) {
            return 1;
          }
          return a.pkgName.localeCompare(b.pkgName);
        })
    );

    setExtensionLanguageKeys(newExtensionLanguageKeys);
  };

  const handleInstall = (pkgName: string, friendlyName: string, version: string) => {
    setStatusText(`Installing extension ${friendlyName}@${version} ...`);

    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.INSTALL, pkgName, version)
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD))
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.LIST))
      .then((extensionDetailsList: [string, string][]) => {
        return (
          extensionDetailsList.find((_details: [string, string]) => _details[0] === pkgName) !==
          undefined
        );
      })
      .then((loaded: boolean) => {
        setStatusText(
          loaded
            ? `Successfully installed and loaded extension ${friendlyName}@${version}`
            : `Could not load extension ${friendlyName}@${version}`
        );
        return loaded;
      })
      .then(() => updateDataSource())
      .catch((e) => log.error(e));
  };

  const handleRemove = (pkgName: string, friendlyName: string) => {
    setStatusText(`Removing extension ${friendlyName}...`);

    ipcRenderer
      .invoke(ipcChannels.EXTENSION_MANAGER.UNINSTALL, pkgName)
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.RELOAD))
      .then(() => ipcRenderer.invoke(ipcChannels.EXTENSION_MANAGER.LIST))
      .then((extensionDetailsList: [string, string][]) => {
        return (
          extensionDetailsList.find((_details: [string, string]) => _details[0] === pkgName) !==
          undefined
        );
      })
      .then((loaded: boolean) => {
        setStatusText(
          loaded
            ? `Failed to remove extension ${friendlyName}`
            : `Successfully removed extension ${friendlyName}`
        );
        return loaded;
      })
      .then(() => updateDataSource())
      .catch((e) => log.error(e));
  };

  useEffect(() => {
    updateDataSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.registryResults, props.filterText]);

  const columns = [
    {
      title: '◇',
      dataIndex: 'language',
      key: 'language',
      width: '5%',
      filters: Object.entries(extensionLanguageKeys).map(([languageKey, count]) => {
        return {
          text: `${Languages[languageKey].name} [${count}]`,
          value: languageKey,
        };
      }),
      filteredValue: undefined,
      onFilter: (value: string | number | boolean, record: ExtensionTableRow) =>
        value === undefined || record.languageKey === value,
      render: function render(_text: string, record: ExtensionTableRow) {
        if (
          record.languageKey === undefined ||
          Languages[record.languageKey] === undefined ||
          record.languageKey === LanguageKey.MULTI
        ) {
          return <></>;
        }
        return (
          <div className="flag-container">
            <img
              src={flags}
              title={Languages[record.languageKey].name}
              alt={Languages[record.languageKey].name}
              className={`flag flag-${Languages[record.languageKey].flagCode}`}
            />
          </div>
        );
      },
    },
    {
      title: 'Name',
      dataIndex: 'friendlyName',
      key: 'friendlyName',
      width: '20%',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: '30%',
    },
    {
      title: 'Latest',
      dataIndex: 'availableVersion',
      key: 'availableVersion',
      width: '10%',
      align: 'center',
    },
    {
      title: 'Current',
      dataIndex: 'installedVersion',
      key: 'installedVersion',
      width: '10%',
      align: 'center',
    },
    {
      title: '',
      key: 'removeButton',
      width: '10%',
      align: 'center',
      render: function render(text: any, record: ExtensionTableRow) {
        return record.installedVersion === undefined ? (
          <></>
        ) : (
          <Button
            type="primary"
            danger
            onClick={() => handleRemove(record.pkgName, record.friendlyName)}
          >
            Remove
          </Button>
        );
      },
    },
    {
      title: '',
      key: 'installUpdateButton',
      width: '10%',
      align: 'center',
      render: function render(text: any, record: ExtensionTableRow) {
        if (record.installedVersion === undefined) {
          return (
            <Button
              onClick={() =>
                handleInstall(record.pkgName, record.friendlyName, record.availableVersion)
              }
            >
              Install
            </Button>
          );
        }
        return record.canUpdate ? (
          <Button
            type="primary"
            onClick={() =>
              handleInstall(record.pkgName, record.friendlyName, record.availableVersion)
            }
          >
            Update
          </Button>
        ) : (
          <></>
        );
      },
    },
    {
      title: '',
      key: 'settingsButton',
      width: '5%',
      align: 'center',
      render: function render(text: any, record: ExtensionTableRow) {
        return record.installedVersion === undefined || !record.hasSettings ? (
          <></>
        ) : (
          <Button
            shape="circle"
            icon={<SettingOutlined onClick={() => props.showExtensionSettingsModal(record.id)} />}
          />
        );
      },
    },
  ];

  return (
    <Table
      dataSource={dataSource}
      // @ts-expect-error cleanup column render types
      columns={columns}
      rowKey="pkgName"
      size="small"
    />
  );
};

export default ExtensionTable;
