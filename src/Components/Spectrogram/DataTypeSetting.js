// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { useDispatch } from 'react-redux';
import { updateDataType } from '../../reducers/fftSlice';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

export default function DataTypeSetting() {
  const dispatch = useDispatch();
  const handleSelect = (e) => {
    dispatch(updateDataType(e));
  };

  return (
    <DropdownButton title="Data Type" id="dropdown-menu-align-right" onSelect={handleSelect}>
      <Dropdown.Item eventKey="cf32_le">complex float32</Dropdown.Item>
      <Dropdown.Item eventKey="ci16_le">complex int16</Dropdown.Item>
    </DropdownButton>
  );
}
