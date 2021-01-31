import React from 'react';
import { Button, Col, Dropdown, Menu, Modal, Row } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { LayoutDirection, PageFit, PageView } from '../models/types';
import styles from './ReaderSettingsModal.css';

type Props = {
  visible: boolean;
  toggleVisible: () => void;
  layoutDirection: LayoutDirection;
  setLayoutDirection: (layoutDirection: LayoutDirection) => void;
  pageView: PageView;
  setPageView: (pageView: PageView) => void;
  pageFit: PageFit;
  setPageFit: (pageFit: PageFit) => void;
  preloadAmount: number;
  setPreloadAmount: (preloadAmount: number) => void;
};

const layoutDirectionText: { [key in LayoutDirection]: string } = {
  [LayoutDirection.LeftToRight]: 'Left-to-Right',
  [LayoutDirection.RightToLeft]: 'Right-to-Left',
};

const pageViewText: { [key in PageView]: string } = {
  [PageView.Single]: 'Single',
  [PageView.Double]: 'Double (Even Start)',
  [PageView.Double_OddStart]: 'Double (Odd Start)',
};

const pageFitText: { [key in PageFit]: string } = {
  [PageFit.Auto]: 'Auto',
  [PageFit.Width]: 'Fit Width',
  [PageFit.Height]: 'Fit Height',
};

const preloadText: { [key: number]: string } = {
  0: 'Disabled',
  1: '1 Page',
  2: '2 Pages',
  3: '3 Pages',
  4: '4 Pages',
  5: '5 Pages',
};

const ReaderSettingsModal: React.FC<Props> = (props: Props) => {
  const renderMenuItems = (textMap: { [key: number]: string }) => {
    return (
      <>
        {Object.entries(textMap).map((entry) => {
          return (
            <Menu.Item key={entry[0]} data-value={entry[0]}>
              {entry[1]}
            </Menu.Item>
          );
        })}
      </>
    );
  };

  const layoutDirectionMenu = (
    <Menu
      onClick={(e) =>
        props.setLayoutDirection(parseInt(e.item.props['data-value'], 10))
      }
    >
      {renderMenuItems(layoutDirectionText)}
    </Menu>
  );

  const pageViewMenu = (
    <Menu
      onClick={(e) => {
        props.setPageView(parseInt(e.item.props['data-value'], 10));
      }}
    >
      {renderMenuItems(pageViewText)}
    </Menu>
  );

  const pageFitMenu = (
    <Menu
      onClick={(e) =>
        props.setPageFit(parseInt(e.item.props['data-value'], 10))
      }
    >
      {renderMenuItems(pageFitText)}
    </Menu>
  );

  const preloadMenu = (
    <Menu
      onClick={(e) =>
        props.setPreloadAmount(parseInt(e.item.props['data-value'], 10))
      }
    >
      {renderMenuItems(preloadText)}
    </Menu>
  );

  return (
    <Modal
      title="Reader Settings"
      visible={props.visible}
      footer={null}
      onCancel={props.toggleVisible}
    >
      <Row className={styles.settingRow}>
        <Col span={16}>Layout Direction</Col>
        <Col span={8}>
          <Dropdown overlay={layoutDirectionMenu}>
            <Button>
              {layoutDirectionText[props.layoutDirection]} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Row className={styles.settingRow}>
        <Col span={16}>Page View</Col>
        <Col span={8}>
          <Dropdown overlay={pageViewMenu}>
            <Button>
              {pageViewText[props.pageView]} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Row className={styles.settingRow}>
        <Col span={16}>Page Fit</Col>
        <Col span={8}>
          <Dropdown overlay={pageFitMenu}>
            <Button>
              {pageFitText[props.pageFit]} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Row className={styles.settingRow}>
        <Col span={16}>Image Preloading</Col>
        <Col span={8}>
          <Dropdown overlay={preloadMenu}>
            <Button>
              {preloadText[props.preloadAmount]} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Button onClick={() => console.log(props.pageView)}>test</Button>
    </Modal>
  );
};

export default ReaderSettingsModal;
