// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import InputGroup from 'react-bootstrap/InputGroup';
import React from 'react';
import { Form } from 'react-bootstrap/esm';
import Button from 'react-bootstrap/Button';
import { useState, useEffect } from 'react';

export default function InfoPane(props) {
  const metaGlobal = props.meta.global;
  const [newMetaGlobal, setNewMetaGlobal] = useState({});
  const [error, setError] = useState('');
  useEffect(() => {
    setNewMetaGlobal(metaGlobal);
  }, [metaGlobal]);

  function titleCase(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  // updates InfoPane state
  const handleChange = (event, key) => {
    var value = event.target.value;
    var newMeta = { ...newMetaGlobal };
    if (key === 'core:extensions') {
      try {
        value = JSON.parse(value);
        setError('');
      } catch (_) {
        setError('Not a valid JSON, please try again');
        return;
      }
    }
    newMeta[key] = value;
    setNewMetaGlobal(newMeta);
  };

  // updates SpectrogramPage state
  function handleClick() {
    props.handleMetaGlobal(newMetaGlobal);
  }

  return (
    <div>
      <Form key={'InfoPane'}>
        {Object.entries(metaGlobal).map(([key, value]) => (
          <Form.Group className="mb-3" controlId="formBasicEmail" key={key}>
            <Form.Label>
              {titleCase(key.replace('core:', '').replace(':', ' ').replace('_', ' ').replace('hw', 'Hardware'))}
            </Form.Label>
            {key === 'core:extensions' && <div style={{ color: 'red' }}>{error}</div>}
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                defaultValue={key === 'core:extensions' ? JSON.stringify(value) : value}
                onChange={(event) => handleChange(event, key)}
                size="sm"
              />
            </InputGroup>
          </Form.Group>
        ))}
        <Button variant="success" onClick={handleClick} disabled={error.length > 0}>
          Save
        </Button>
      </Form>
    </div>
  );
}
