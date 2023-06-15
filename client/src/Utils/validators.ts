import Ajv from 'ajv';
import sigmfSchema from '@/Utils/sigmf-schema.json';
import sigmfAnnotationsSchema from '@/Utils/sigmf-annotations-schema.json';
import { json } from 'react-router-dom';

interface MetadataValidator {
  metadata: string;
  errors: any[];
}

interface AnnotationsValidator {
  annotations: string;
  errors: any[];
}

export function metadataValidator(metadataValue: string) {
  const metadataValidator = { metadata: metadataValue, errors: [] } as MetadataValidator;
  metadataValidator.metadata = metadataValue;

  return validator(metadataValue, sigmfSchema, metadataValidator);
}

export function annotationsValidator(annotationsValue: string) {
  const annotationValidator = { annotations: annotationsValue, errors: [] } as AnnotationsValidator;
  annotationValidator.annotations = annotationsValue;

  return validator(annotationsValue, sigmfAnnotationsSchema, annotationValidator);
}

export function validator(value: string, schema: any, validator: any){
  const ajv = new Ajv({ strict: false, allErrors: true });
  try {
    const jsonValue = JSON.parse(value);

    const validate = ajv.compile(schema);
    const valid = validate(jsonValue);

    if (valid) {
      validator.errors = [];
    } else {
      validator.errors = validate.errors;
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      validator.errors = [{ message: 'Syntax Error: ' + e.message }];
    } else {
      validator.errors = [{ message: 'Error' + e.message }];
    }
  }
  return validator;
}
