// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { RESET_META_OBJ, RETURN_META_DATA_BLOB } from '../../Constants/FetchMetaTypes';

const initialState = { annotations: [], captures: [], global: {} };

export default function fetchMetaReducer(state = initialState, action) {
  switch (action.type) {
    case RETURN_META_DATA_BLOB: {
      return {
        ...action.payload,
      };
    }
    case RESET_META_OBJ: {
      return {
        annotations: [],
        captures: [],
        global: {},
      };
    }
    default:
      return state;
  }
}
