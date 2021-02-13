import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Alert, Input, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import styles from './Search.css';
import routes from '../constants/routes.json';
import { ExtensionMetadata } from '../services/extensions/types';
import {
  getExtensionMetadata,
  getSearchableExtensions,
  search,
} from '../services/extension';
import { Series } from '../models/types';

const { Title, Text } = Typography;

type Props = {
  searchExtension: number;
  setSearchExtension: (searchExtension: number) => void;
};

const Search: React.FC<Props> = (props: Props) => {
  const [searchText, setSearchText] = useState('');

  const getExtensionName = (extensionId: number) => {
    const metadata: ExtensionMetadata = getExtensionMetadata(extensionId);
    return metadata.name;
  };

  const handleSearch = async () => {
    const seriesList: Series[] = await search(
      props.searchExtension,
      searchText
    );

    console.log(seriesList);
  };

  const renderAlert = () => {
    const metadata: ExtensionMetadata = getExtensionMetadata(
      props.searchExtension
    );
    if (metadata.notice.length > 0) {
      return <Alert message={`Notice: ${metadata.notice}`} type="warning" />;
    }
  };

  const extensionMenu = (
    <Menu
      onClick={(e) =>
        props.setSearchExtension(parseInt(e.item.props['data-value'], 10))
      }
    >
      {Object.values(getSearchableExtensions()).map((extension: any) => {
        const { id } = extension.METADATA;
        return (
          <Menu.Item key={id} data-value={id}>
            {getExtensionName(id)}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <>
      <div className={styles.searchBar}>
        <Dropdown className={styles.extensionDropdown} overlay={extensionMenu}>
          <Button>
            Extension: {getExtensionName(props.searchExtension)}{' '}
            <DownOutlined />
          </Button>
        </Dropdown>
        <Input
          className={styles.searchField}
          placeholder="Search for a series..."
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
        />
      </div>
      {renderAlert()}
    </>
  );
};

export default Search;
