/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ConnectorServiceNowITSMTypeFields } from '../../../common/types/domain';
import type { ServiceNowITSMFormat } from './types';

export const format: ServiceNowITSMFormat = (theCase, alerts) => {
  const {
    severity = null,
    urgency = null,
    impact = null,
    category = null,
    subcategory = null,
    additionalFields = null,
  } = (theCase.connector.fields as ConnectorServiceNowITSMTypeFields['fields']) ?? {};
  return {
    severity,
    urgency,
    impact,
    category,
    subcategory,
    additional_fields: additionalFields,
    correlation_id: theCase.id ?? null,
    correlation_display: 'Elastic Case',
  };
};
