import React, { useCallback, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { ErrorSchema, RJSFSchema } from '@rjsf/utils';
//import isEqualWith from 'lodash/isEqualWith';

const monacoEditorOptions = {
  minimap: {
    enabled: false,
  },
  automaticLayout: true,
};

type EditorProps = {
  title: string;
  code: string;
  onChange: (code: string) => void;
};

function Editor({ title, code, onChange }: EditorProps) {
  const [valid, setValid] = useState(true);

  const onCodeChange = useCallback(
    (code: string | undefined) => {
      if (!code) {
        return;
      }

      try {
        const parsedCode = JSON.parse(code);
        setValid(true);
        onChange(parsedCode);
      } catch (err) {
        setValid(false);
      }
    },
    [setValid, onChange]
  );

  const icon = valid ? 'ok' : 'remove';
  const cls = valid ? 'valid' : 'invalid';

  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <span className={`${cls} glyphicon glyphicon-${icon}`} />
        {' ' + title}
      </div>
      <MonacoEditor
        language="json"
        value={code}
        theme="vs-light"
        onChange={onCodeChange}
        height={1000}
        options={monacoEditorOptions}
      />
    </div>
  );
}

const toJson = (val: unknown) => JSON.stringify(val, null, 2);

type EditorsProps = {
  schema: RJSFSchema;
  setSchema: React.Dispatch<React.SetStateAction<RJSFSchema>>;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  extraErrors: ErrorSchema | undefined;
  setExtraErrors: React.Dispatch<React.SetStateAction<ErrorSchema | undefined>>;
  setShareURL: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function Editors({
  extraErrors,
  formData,
  schema,
  setExtraErrors,
  setFormData,
  setSchema,
  setShareURL,
}: EditorsProps) {
  const onSchemaEdited = useCallback(
    (newSchema) => {
      setSchema(newSchema);
      setShareURL(null);
    },
    [setSchema, setShareURL]
  );

  const onFormDataEdited = useCallback(
    (newFormData) => {
      /* MARC COMMENTED THIS OUT BECAUSE LODASH WOULDNT WORK
      if (
        !isEqualWith(newFormData, formData, (newValue, oldValue) => {
          // Since this is coming from the editor which uses JSON.stringify to trim undefined values compare the values
          // using JSON.stringify to see if the trimmed formData is the same as the untrimmed state
          // Sometimes passing the trimmed value back into the Form causes the defaults to be improperly assigned
          return JSON.stringify(oldValue) === JSON.stringify(newValue);
        })
      ) {
        setFormData(newFormData);
        setShareURL(null);
      }
      */
      setFormData(newFormData);
      setShareURL(null);
    },
    [formData, setFormData, setShareURL]
  );

  const onExtraErrorsEdited = useCallback(
    (newExtraErrors) => {
      setExtraErrors(newExtraErrors);
      setShareURL(null);
    },
    [setExtraErrors, setShareURL]
  );

  return (
    <>
      <br></br>
      <div className="row">
        <div className="col-sm-6">
          <Editor
            title="SigMF JSON Schema (don't edit unless you know what you're doing)"
            code={toJson(schema)}
            onChange={onSchemaEdited}
          />
        </div>
        <div className="col-sm-6">
          <Editor title="Your .sigmf-meta JSON to be validated" code={toJson(formData)} onChange={onFormDataEdited} />
        </div>
      </div>
      {extraErrors && (
        <div className="row">
          <div className="col">
            <Editor title="extraErrors" code={toJson(extraErrors || {})} onChange={onExtraErrorsEdited} />
          </div>
        </div>
      )}
    </>
  );
}
