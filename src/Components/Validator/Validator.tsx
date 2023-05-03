import React from 'react';
import v8Validator from '@rjsf/validator-ajv8';

//import Layout from './layout';
import Playground, { PlaygroundProps } from './components';

const validators: PlaygroundProps['validators'] = {
  AJV8: v8Validator,
};

const themes: PlaygroundProps['themes'] = {
  default: {
    stylesheet: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css',
    theme: {},
    subthemes: {},
  },
};

export default function Validator() {
  return <Playground themes={themes} validators={validators} />;
}
