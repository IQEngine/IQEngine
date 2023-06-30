import Ajv from 'ajv';
import sigmfSchema from '@/data/sigmf-schema.json';

interface MetadataValidator {
  metadata: string;
  errors: any[];
}

export function metadataValidator(metadataValue: string, path: string = null) {
  let metadataValidator = { metadata: metadataValue, errors: [] } as MetadataValidator;
  metadataValidator.metadata = metadataValue;

  return validator(metadataValue, sigmfSchema, metadataValidator, path);
}

export function validator(value: string, schema: any, validator: any, path: string = null) {
  const ajv = new Ajv({ strict: false, allErrors: true });
  try {
    const jsonValue = JSON.parse(value);

    const validate = ajv.compile(schema);
    const valid = validate(jsonValue);

    if (valid) {
      validator.errors = [];
    } else {
      validator.errors = validate.errors;
      if (path) {
        validator.errors = validator.errors.filter((error) => error?.instancePath?.startsWith(path));
      }
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
