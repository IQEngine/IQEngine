import Ajv from 'ajv';
import sigmfSchema from '@/Utils/sigmf-schema.json';

interface MetadataValidator {
  metadata: string;
  errors: any[];
}

export function metadataValidator(metadataValue: string) {
  const ajv = new Ajv({ strict: false, allErrors: true });
  const metadataValidator = { metadata: metadataValue, errors: [] } as MetadataValidator;
  try {
    metadataValidator.metadata = metadataValue;
    const metadataJSON = JSON.parse(metadataValue);

    const validate = ajv.compile(sigmfSchema);
    const valid = validate(metadataJSON);

    if (valid) {
      metadataValidator.errors = [];
    } else {
      metadataValidator.errors = validate.errors;
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      metadataValidator.errors = [{ message: 'Syntax Error: ' + e.message }];
    } else {
      metadataValidator.errors = [{ message: 'Error' + e.message }];
    }
  }
  return metadataValidator;
}
