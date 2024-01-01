import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import sigmfSchema from '@/data/sigmf-schema.json';

interface MetadataValidatorProps {
  metadata: string;
  errors: any[];
}

export function metadataValidator(metadataValue: string, path: string = null, additionalProperties: boolean = true) {
  let metadataValidator = { metadata: metadataValue, errors: [] } as MetadataValidatorProps;
  metadataValidator.metadata = metadataValue;
  let sigmfSchemaCopy = JSON.parse(JSON.stringify(sigmfSchema));
  if (!additionalProperties) {
    sigmfSchemaCopy.properties.global.additionalProperties = false;
    sigmfSchemaCopy.properties.captures.items.anyOf[0].additionalProperties = false;
    sigmfSchemaCopy.properties.annotations.items.anyOf[0].additionalProperties = false;
  }
  return validator(metadataValue, sigmfSchemaCopy, metadataValidator, path);
}

export function validator(value: string, schema: any, validator: any, path: string = null) {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);
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
