import React, { useEffect, useState } from 'react';
import { Series, TriState } from 'houdoku-extension-lib';
import { useRecoilState, useRecoilValue } from 'recoil';
import { ScrollArea, Text } from '@mantine/core';
import LibraryControlBar from './LibraryControlBar';
import { LibrarySort, LibraryView, ProgressFilter } from '../../models/types';
import { filterCategoriesState, filterState, seriesListState } from '../../state/libraryStates';
import {
  libraryFilterStatusState,
  libraryFilterProgressState,
  librarySortState,
  libraryViewsState,
} from '../../state/settingStates';
import LibraryGrid from './LibraryGrid';
import RemoveSeriesModal from './RemoveSeriesModal';
import LibraryList from './LibraryList';
import library from '../../services/library';

// eslint-disable-next-line @typescript-eslint/ban-types
type Props = {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Library: React.FC<Props> = (_props: Props) => {
  const [removeModalShowing, setRemoveModalShowing] = useState(false);
  const [removeModalSeries, setRemoveModalSeries] = useState<Series | null>(null);
  const [seriesList, setSeriesList] = useRecoilState(seriesListState);
  const filter = useRecoilValue(filterState);
  const filterCategories = useRecoilValue(filterCategoriesState);
  const libraryFilterStatus = useRecoilValue(libraryFilterStatusState);
  const libraryFilterProgress = useRecoilValue(libraryFilterProgressState);
  const libraryView = useRecoilValue(libraryViewsState);
  const librarySort = useRecoilValue(librarySortState);

  /**
   * Get a filtered (and sorted) list of series after applying the specified filters.
   * @param seriesList the list of series to filter
   * @returns a sorted list of series matching all filter props
   */
  const getFilteredList = (): Series[] => {
    const filteredList = seriesList.filter((series: Series) => {
      if (!series) return false;

      if (!series.title.toLowerCase().includes(filter.toLowerCase())) return false;
      if (libraryFilterStatus !== null && series.status !== libraryFilterStatus) {
        return false;
      }
      if (libraryFilterProgress === ProgressFilter.Unread && series.numberUnread === 0) {
        return false;
      }
      if (libraryFilterProgress === ProgressFilter.Finished && series.numberUnread > 0) {
        return false;
      }

      const categories = series.categories || [];
      const matchesFilterCategories = Object.entries(filterCategories)
        .map(([categoryId, value]) => {
          if (value === TriState.INCLUDE) return categories.includes(categoryId);
          if (value === TriState.EXCLUDE) return !categories.includes(categoryId);
          return true;
        })
        .every((matches) => matches);
      if (!matchesFilterCategories) return false;

      return true;
    });

    switch (librarySort) {
      case LibrarySort.UnreadAsc:
        return filteredList.sort((a: Series, b: Series) => a.numberUnread - b.numberUnread);
      case LibrarySort.UnreadDesc:
        return filteredList.sort((a: Series, b: Series) => b.numberUnread - a.numberUnread);
      case LibrarySort.TitleAsc:
        return filteredList.sort((a: Series, b: Series) => a.title.localeCompare(b.title));
      case LibrarySort.TitleDesc:
        return filteredList.sort((a: Series, b: Series) => b.title.localeCompare(a.title));
      default:
        return filteredList;
    }
  };

  const renderLibrary = () => {
    return (
      <>
        <RemoveSeriesModal
          series={removeModalSeries}
          showing={removeModalShowing}
          close={() => setRemoveModalShowing(false)}
        />

        {libraryView === LibraryView.Grid ? (
          <LibraryGrid
            getFilteredList={getFilteredList}
            showRemoveModal={(series) => {
              setRemoveModalSeries(series);
              setRemoveModalShowing(true);
            }}
          />
        ) : (
          <LibraryList
            getFilteredList={getFilteredList}
            showRemoveModal={(series) => {
              setRemoveModalSeries(series);
              setRemoveModalShowing(true);
            }}
          />
        )}
      </>
    );
  };

  const renderEmptyMessage = () => {
    return (
      <Text align="center" style={{ paddingTop: '30vh' }}>
        Your library is empty. Install{' '}
        <Text component="span" color="violet" weight={700}>
          Extensions
        </Text>{' '}
        from the tab on the left,
        <br />
        and then go to{' '}
        <Text component="span" color="teal" weight={700}>
          Add Series
        </Text>{' '}
        to start building your library.
      </Text>
    );
  };

  useEffect(() => setSeriesList(library.fetchSeriesList()), [setSeriesList]);

  return (
    <>
      <LibraryControlBar />
      <ScrollArea style={{ height: 'calc(100vh - 24px - 72px)' }} pr="xl" mr={-16}>
        {seriesList.length > 0 ? renderLibrary() : renderEmptyMessage()}
      </ScrollArea>
    </>
  );
};

export default Library;
