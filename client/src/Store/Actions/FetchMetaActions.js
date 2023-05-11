// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import { RESET_META_OBJ, RETURN_META_DATA_BLOB } from '../../Constants/FetchMetaTypes';
import { FetchMeta } from '../../Sources/FetchMetaSource';

export const returnMetaDataBlob = (payload) => ({
  type: RETURN_META_DATA_BLOB,
  payload,
});

export const resetMeta = () => ({
  type: RESET_META_OBJ,
});

export const fetchMetaDataBlob = (connection) => FetchMeta(connection);
