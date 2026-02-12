import { defaultSchemaV2 } from '../schema/hypnagnosisSchemaV2';
import { migrateToV2 } from '../schema/migrateToV2';

export const DEFAULT_FORM = defaultSchemaV2;

export const serializePreset = (form) => JSON.stringify(migrateToV2(form), null, 2);

export const parsePreset = (text) => {
  const data = JSON.parse(text);
  return migrateToV2(data);
};
