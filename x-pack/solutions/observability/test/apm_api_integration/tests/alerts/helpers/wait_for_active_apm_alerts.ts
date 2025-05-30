/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import type { Client } from '@elastic/elasticsearch';
import { ToolingLog } from '@kbn/tooling-log';
import { retryForSuccess } from '@kbn/ftr-common-functional-services';
import { APM_ALERTS_INDEX } from './constants';
export async function getActiveApmAlerts({
  ruleId,
  esClient,
}: {
  ruleId: string;
  waitMillis?: number;
  esClient: Client;
}): Promise<Record<string, any>> {
  const searchParams = {
    index: APM_ALERTS_INDEX,
    size: 1,
    query: {
      bool: {
        filter: [
          {
            term: {
              'kibana.alert.rule.producer': 'apm',
            },
          },
          {
            term: {
              'kibana.alert.status': 'active',
            },
          },
          {
            term: {
              'kibana.alert.rule.uuid': ruleId,
            },
          },
        ],
      },
    },
  };
  const response = await esClient.search(searchParams);
  return response.hits.hits.map((hit) => hit._source);
}

const RETRIES_COUNT = 10;
export function waitForActiveApmAlert({
  ruleId,
  esClient,
  log,
}: {
  ruleId: string;
  waitMillis?: number;
  esClient: Client;
  log: ToolingLog;
}): Promise<Record<string, any>> {
  log.debug(`Wait for the rule ${ruleId} to be active`);
  return retryForSuccess(log, {
    timeout: 20_000,
    methodName: 'waitForActiveApmAlert',
    block: async () => {
      const activeApmAlerts = await getActiveApmAlerts({ ruleId, esClient });

      if (activeApmAlerts.length === 0) {
        log.debug(`No active alert found for rule ${ruleId}`);
        throw new Error(`No active alert found for rule ${ruleId}`);
      }
      log.debug(`Get active alert for the rule ${ruleId}`);

      return activeApmAlerts[0];
    },
    retryCount: RETRIES_COUNT,
    retryDelay: 500,
  });
}
