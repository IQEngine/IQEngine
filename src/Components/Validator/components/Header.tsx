import React, { useCallback } from 'react';
import Form, { IChangeEvent } from '@rjsf/core';
import { RJSFSchema, ValidatorType } from '@rjsf/utils';
import localValidator from '@rjsf/validator-ajv8';
import CopyLink from './CopyLink';
import { ThemesType } from './ThemeSelector';
import ValidatorSelector from './ValidatorSelector';
import RawValidatorTest from './RawValidatorTest';

const HeaderButton: React.FC<
  {
    title: string;
    onClick: () => void;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ title, onClick, children, ...buttonProps }) => {
  return (
    <button type="button" className="btn btn-default" title={title} onClick={onClick} {...buttonProps}>
      {children}
    </button>
  );
};

function HeaderButtons({ playGroundFormRef }: { playGroundFormRef: React.MutableRefObject<any> }) {
  return (
    <>
      <HeaderButton
        title="Click me to submit the form programmatically."
        onClick={() => playGroundFormRef.current.submit()}
      >
        Prog. Submit
      </HeaderButton>{' '}
      <HeaderButton
        title="Click me to validate the form programmatically."
        onClick={() => playGroundFormRef.current.validateForm()}
      >
        Prog. Validate
      </HeaderButton>{' '}
      <HeaderButton
        title="Click me to reset the form programmatically."
        onClick={() => playGroundFormRef.current.reset()}
      >
        Prog. Reset
      </HeaderButton>
    </>
  );
}

const liveSettingsSchema: RJSFSchema = {
  type: 'object',
  properties: {
    liveValidate: { type: 'boolean', title: 'Live validation' },
    disabled: { type: 'boolean', title: 'Disable whole form' },
    readonly: { type: 'boolean', title: 'Readonly whole form' },
    omitExtraData: { type: 'boolean', title: 'Omit extra data' },
    liveOmit: { type: 'boolean', title: 'Live omit' },
    noValidate: { type: 'boolean', title: 'Disable validation' },
    noHtml5Validate: { type: 'boolean', title: 'Disable HTML 5 validation' },
    focusOnFirstError: { type: 'boolean', title: 'Focus on 1st Error' },
    showErrorList: {
      type: 'string',
      default: 'top',
      title: 'Show Error List',
      enum: [false, 'top', 'bottom'],
    },
  },
};

export interface LiveSettings {
  showErrorList: false | 'top' | 'bottom';
  [key: string]: any;
}

type HeaderProps = {
  schema: RJSFSchema;
  formData: any;
  shareURL: string | null;
  themes: { [themeName: string]: ThemesType };
  theme: string;
  subtheme: string | null;
  validators: {
    [validatorName: string]: ValidatorType<any, RJSFSchema, any>;
  };
  validator: string;
  liveSettings: LiveSettings;
  playGroundFormRef: React.MutableRefObject<any>;
  onThemeSelected: (theme: string, themeObj: ThemesType) => void;
  setSubtheme: React.Dispatch<React.SetStateAction<string | null>>;
  setStylesheet: React.Dispatch<React.SetStateAction<string | null>>;
  setValidator: React.Dispatch<React.SetStateAction<string>>;
  setLiveSettings: React.Dispatch<React.SetStateAction<LiveSettings>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function Header({
  schema,
  formData,
  shareURL,
  theme,
  validators,
  validator,
  liveSettings,
  playGroundFormRef,
  setValidator,
  setLiveSettings,
  setShareURL,
}: HeaderProps) {
  const onValidatorSelected = useCallback(
    (validator: string) => {
      setValidator(validator);
    },
    [setValidator]
  );

  const handleSetLiveSettings = useCallback(
    ({ formData }: IChangeEvent) => {
      setLiveSettings(formData);
    },
    [setLiveSettings]
  );

  const onShare = useCallback(() => {
    const {
      location: { origin, pathname },
    } = document;

    try {
      const hash = btoa(
        JSON.stringify({
          formData,
          schema,
          theme,
          liveSettings,
        })
      );

      setShareURL(`${origin}${pathname}#${hash}`);
    } catch (error) {
      setShareURL(null);
      console.error(error);
    }
  }, [formData, liveSettings, schema, theme, setShareURL]);

  return (
    <div className="page-header">
      <div className="row">
        <div className="col-sm-2">
          <Form
            idPrefix="rjsf_options"
            schema={liveSettingsSchema}
            formData={liveSettings}
            validator={localValidator}
            onChange={handleSetLiveSettings}
          >
            <div />
          </Form>
        </div>
        <div className="col-sm-2">
          <ValidatorSelector validators={validators} validator={validator} select={onValidatorSelected} />
          <HeaderButtons playGroundFormRef={playGroundFormRef} />
          <div style={{ marginTop: '5px' }} />
          <CopyLink shareURL={shareURL} onShare={onShare} />
        </div>
        <div className="col-sm-2">
          <RawValidatorTest validator={validators[validator]} schema={schema} formData={formData} />
        </div>
      </div>
    </div>
  );
}
