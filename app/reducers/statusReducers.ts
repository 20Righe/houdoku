import { StatusState } from '../types/states/statusStateTypes';
import { SET_STATUS_TEXT } from '../types/actions/statusActionTypes';

const initialState: StatusState = {
  text: 'No status set...',
};

export default function status(
  state = initialState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
): StatusState {
  switch (action.type) {
    case SET_STATUS_TEXT:
      return { ...state, text: action.payload.text };
    default:
      return state;
  }
}
