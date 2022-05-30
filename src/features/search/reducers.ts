import { FS_METADATA } from '../../services/extensions/filesystem';
import {
  SearchState,
  SET_ADD_MODAL_SERIES,
  SET_SEARCH_EXTENSION,
  SET_SEARCH_RESULTS,
  TOGGLE_SHOWING_ADD_MODAL,
} from './types';

const initialState: SearchState = {
  searchExtension: FS_METADATA.id,
  searchResults: [],
  addModalSeries: undefined,
  addModalEditable: false,
  showingAddModal: false,
};

export default function search(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state = initialState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
): SearchState {
  switch (action.type) {
    case SET_SEARCH_EXTENSION:
      return { ...state, searchExtension: action.payload.searchExtension };
    case SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload.searchResults };
    case TOGGLE_SHOWING_ADD_MODAL:
      return {
        ...state,
        showingAddModal: !state.showingAddModal,
        addModalEditable: action.payload.editable,
      };
    case SET_ADD_MODAL_SERIES:
      return { ...state, addModalSeries: action.payload.addModalSeries };
    default:
      return state;
  }
}
