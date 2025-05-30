/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { pick, get, partition } from 'lodash';

import type { SignalSourceHit } from '../types';

/**
 * partition events in 2 arrays:
 * 1. first one, where no suppressed by field has empty value
 * 2. where any of fields is empty
 */
export const partitionMissingFieldsEvents = <
  T extends SignalSourceHit | { event: SignalSourceHit } | Record<string, string | null | number>
>(
  events: T[],
  suppressedBy: string[] = [],
  // path to fields property within event object. At this point, it can be in root of event object or within event key
  fieldsPath: ['event', 'fields'] | ['fields'] | [] = [],
  mergeSourceAndFields: boolean = false
): T[][] => {
  return partition(events, (event) => {
    if (suppressedBy.length === 0) {
      return true;
    }
    const eventFields = fieldsPath.length ? get(event, fieldsPath) : event;
    const sourceFields =
      (event as SignalSourceHit)?._source || (event as { event: SignalSourceHit })?.event?._source;

    const fields = mergeSourceAndFields ? { ...sourceFields, ...eventFields } : eventFields;

    const hasMissingFields = Object.keys(pick(fields, suppressedBy)).length < suppressedBy.length;

    return !hasMissingFields;
  });
};
