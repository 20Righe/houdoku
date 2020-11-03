import { Series } from '../models/types';

export const BEFORE_LOAD_SERIES_LIST = 'BEFORE_LOAD_SERIES_LIST';
export const AFTER_LOAD_SERIES_LIST = 'AFTER_LOAD_SERIES_LIST';
export const BEFORE_LOAD_SERIES = 'BEFORE_LOAD_SERIES';
export const AFTER_LOAD_SERIES = 'AFTER_LOAD_SERIES';

export interface DatabaseState {
  fetchingSeriesList: boolean;
  seriesList: Series[];
  fetchingSeries: boolean;
  series?: Series;
}

interface BeforeLoadSeriesListAction {
  type: typeof BEFORE_LOAD_SERIES_LIST;
  payload: unknown;
}

interface AfterLoadSeriesListAction {
  type: typeof AFTER_LOAD_SERIES_LIST;
  payload: {
    response: unknown;
  };
}

interface BeforeLoadSeriesAction {
  type: typeof BEFORE_LOAD_SERIES;
  payload: unknown;
}

interface AfterLoadSeriesAction {
  type: typeof AFTER_LOAD_SERIES;
  payload: {
    series: Series;
  };
}

export type DatabaseAction =
  | BeforeLoadSeriesListAction
  | AfterLoadSeriesListAction
  | BeforeLoadSeriesAction
  | AfterLoadSeriesAction;
