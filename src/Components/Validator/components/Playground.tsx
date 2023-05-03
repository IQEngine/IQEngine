import React from 'react';

import { useCallback, useState, useRef, useEffect, ComponentType, FormEvent } from 'react';
import { withTheme, IChangeEvent, FormProps } from '@rjsf/core';
import {
  ErrorSchema,
  ArrayFieldTemplateProps,
  ObjectFieldTemplateProps,
  RJSFSchema,
  RJSFValidationError,
  TemplatesType,
  ValidatorType,
} from '@rjsf/utils';

import { sigmfSchema } from '../SigMFSchema';
import { sigmfFormData } from '../FormData';
import Header, { LiveSettings } from './Header';
import DemoFrame from './DemoFrame';
import ErrorBoundary from './ErrorBoundary';
import GeoPosition from './GeoPosition';
import { ThemesType } from './ThemeSelector';
import Editors from './Editors';

export interface PlaygroundProps {
  themes: { [themeName: string]: ThemesType };
  validators: { [validatorName: string]: ValidatorType };
}

export default function Playground({ themes, validators }: PlaygroundProps) {
  const [loaded, setLoaded] = useState(false);
  const [schema, setSchema] = useState<RJSFSchema>(sigmfSchema as RJSFSchema);
  const [formData, setFormData] = useState<any>(sigmfFormData);
  const [extraErrors, setExtraErrors] = useState<ErrorSchema | undefined>();
  const [shareURL, setShareURL] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('default');
  const [subtheme, setSubtheme] = useState<string | null>(null);
  const [stylesheet, setStylesheet] = useState<string | null>(null);
  const [validator, setValidator] = useState<string>('AJV8');
  const [showForm, setShowForm] = useState(false);
  const [liveSettings, setLiveSettings] = useState<LiveSettings>({
    showErrorList: 'top',
    validate: false,
    disabled: false,
    noHtml5Validate: false,
    readonly: false,
    omitExtraData: false,
    liveOmit: false,
  });
  const [FormComponent, setFormComponent] = useState<ComponentType<FormProps>>(withTheme({}));
  const [ArrayFieldTemplate, setArrayFieldTemplate] = useState<ComponentType<ArrayFieldTemplateProps>>();
  const [ObjectFieldTemplate, setObjectFieldTemplate] = useState<ComponentType<ObjectFieldTemplateProps>>();

  const playGroundFormRef = useRef<any>(null);

  const onThemeSelected = useCallback(
    (theme: string, { stylesheet, theme: themeObj }: ThemesType) => {
      setTheme(theme);
      setSubtheme(null);
      setFormComponent(withTheme(themeObj));
      setStylesheet(stylesheet);
    },
    [setTheme, setSubtheme, setFormComponent, setStylesheet]
  );

  const load = useCallback(
    (data: any) => {
      // Reset the ArrayFieldTemplate whenever you load new data
      const { ArrayFieldTemplate, ObjectFieldTemplate, extraErrors, liveSettings } = data;
      const { schema, formData, theme: dataTheme = theme } = data;

      onThemeSelected(dataTheme, themes[dataTheme]);

      // force resetting form component instance
      setShowForm(false);
      setSchema(schema);
      setFormData(formData);
      setExtraErrors(extraErrors);
      setTheme(dataTheme);
      setArrayFieldTemplate(ArrayFieldTemplate);
      setObjectFieldTemplate(ObjectFieldTemplate);
      setLiveSettings(liveSettings);
      setShowForm(true);
    },
    [theme, onThemeSelected, themes]
  );

  useEffect(() => {
    const hash = document.location.hash.match(/#(.*)/);

    if (hash && typeof hash[1] === 'string' && hash[1].length > 0 && !loaded) {
      try {
        load(JSON.parse(atob(hash[1])));
        setLoaded(true);
      } catch (error) {
        alert('Unable to load form setup data.');
        console.error(error);
      }

      return;
    }

    // initialize theme
    onThemeSelected(theme, themes[theme]);

    setShowForm(true);
  }, [onThemeSelected, load, loaded, setShowForm, theme, themes]);

  const onFormDataChange = useCallback(
    ({ formData }: IChangeEvent, id?: string) => {
      if (id) {
        console.log('Field changed, id: ', id);
      }

      setFormData(formData);
      setShareURL(null);
    },
    [setFormData, setShareURL]
  );

  const onFormDataSubmit = useCallback(({ formData }: IChangeEvent, event: FormEvent<any>) => {
    console.log('submitted formData', formData);
    console.log('submit event', event);
    window.alert('Form submitted');
  }, []);

  const templates: Partial<TemplatesType> = {};
  if (ArrayFieldTemplate) {
    templates.ArrayFieldTemplate = ArrayFieldTemplate;
  }
  if (ObjectFieldTemplate) {
    templates.ObjectFieldTemplate = ObjectFieldTemplate;
  }

  return (
    <>
      <Header
        schema={schema}
        formData={formData}
        shareURL={shareURL}
        themes={themes}
        theme={theme}
        subtheme={subtheme}
        validators={validators}
        validator={validator}
        liveSettings={liveSettings}
        playGroundFormRef={playGroundFormRef}
        onThemeSelected={onThemeSelected}
        setSubtheme={setSubtheme}
        setStylesheet={setStylesheet}
        setValidator={setValidator}
        setLiveSettings={setLiveSettings}
        setShareURL={setShareURL}
      />
      <Editors
        formData={formData}
        setFormData={setFormData}
        schema={schema}
        setSchema={setSchema}
        extraErrors={extraErrors}
        setExtraErrors={setExtraErrors}
        setShareURL={setShareURL}
      />
      <div className="col-sm-5">
        <ErrorBoundary>
          {showForm && (
            <DemoFrame
              head={
                <>
                  <link rel="stylesheet" id="theme" href={stylesheet || ''} />
                </>
              }
              style={{
                width: '100%',
                height: 1000,
                border: 0,
              }}
              theme={theme}
            >
              <FormComponent
                {...liveSettings}
                templates={templates}
                extraErrors={extraErrors}
                schema={schema}
                formData={formData}
                fields={{ geo: GeoPosition }}
                validator={validators[validator]}
                onChange={onFormDataChange}
                onSubmit={onFormDataSubmit}
                onBlur={(id: string, value: string) => console.log(`Touched ${id} with value ${value}`)}
                onFocus={(id: string, value: string) => console.log(`Focused ${id} with value ${value}`)}
                onError={(errorList: RJSFValidationError[]) => console.log('errors', errorList)}
                ref={playGroundFormRef}
              />
            </DemoFrame>
          )}
        </ErrorBoundary>
      </div>
    </>
  );
}
