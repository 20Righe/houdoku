import {
  LibraryState,
  UPDATE_SERIES_LIST,
  CHANGE_NUM_COLUMNS,
  SET_FILTER,
  SET_SERIES_BANNER_URL,
  SET_SERIES_LIST,
  SET_SERIES,
  SET_CHAPTER_LIST,
} from './types';

const initialState: LibraryState = {
  seriesList: [],
  series: undefined,
  chapterList: [],
  columns: 6,
  filter: '',
  seriesBannerUrl: null,
};

export default function library(
  state = initialState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
): LibraryState {
  switch (action.type) {
    case SET_SERIES_LIST:
      return { ...state, seriesList: action.payload.seriesList };
    case SET_SERIES:
      return { ...state, series: action.payload.series };
    case SET_CHAPTER_LIST:
      return { ...state, chapterList: action.payload.chapterList };
    case UPDATE_SERIES_LIST:
      return { ...state, columns: 2 };
    case CHANGE_NUM_COLUMNS:
      return { ...state, columns: action.payload.columns };
    case SET_FILTER:
      return { ...state, filter: action.payload.filter };
    case SET_SERIES_BANNER_URL:
      return { ...state, seriesBannerUrl: action.payload.seriesBannerUrl };
    default:
      return state;
  }
}
