/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { format } from 'url';
import supertest from 'supertest';
import request from 'superagent';
import type {
  APIReturnType,
  APIClientRequestParamsOf,
} from '@kbn/apm-plugin/public/services/rest/create_call_apm_api';
import { Config, kbnTestConfig, kibanaTestSuperuserServerless } from '@kbn/test';
import type { APIEndpoint } from '@kbn/apm-plugin/server';
import { formatRequest } from '@kbn/server-route-repository';
import type { InternalRequestHeader, RoleCredentials } from '../../../../../shared/services';
import { InheritedFtrProviderContext } from '../../../../services';

export function createApmApiClient(st: supertest.Agent) {
  return async <TEndpoint extends APIEndpoint>(
    options: {
      type?: 'form-data';
      endpoint: TEndpoint;
      roleAuthc: RoleCredentials;
      internalReqHeader: InternalRequestHeader;
    } & APIClientRequestParamsOf<TEndpoint> & { params?: { query?: { _inspect?: boolean } } }
  ): Promise<SupertestReturnType<TEndpoint>> => {
    const { endpoint, type, roleAuthc, internalReqHeader } = options;

    const params = 'params' in options ? (options.params as Record<string, any>) : {};

    const { method, pathname, version } = formatRequest(endpoint, params.path);
    const url = format({ pathname, query: params?.query });

    const headers: Record<string, string> = { ...internalReqHeader, ...roleAuthc.apiKeyHeader };
    if (version) {
      headers['Elastic-Api-Version'] = version;
    }

    let res: request.Response;
    if (type === 'form-data') {
      const fields: Array<[string, any]> = Object.entries(params.body);
      const formDataRequest = st[method](url)
        .set(headers)
        .set('Content-type', 'multipart/form-data');

      for (const field of fields) {
        void formDataRequest.field(field[0], field[1]);
      }

      res = await formDataRequest;
    } else if (params.body) {
      res = await st[method](url).send(params.body).set(headers);
    } else {
      res = await st[method](url).set(headers);
    }

    // supertest doesn't throw on http errors
    if (res?.status !== 200) {
      throw new ApmApiError(res, endpoint);
    }

    return res;
  };
}

type ApiErrorResponse = Omit<request.Response, 'body'> & {
  body: {
    statusCode: number;
    error: string;
    message: string;
    attributes: object;
  };
};

export type ApmApiSupertest = ReturnType<typeof createApmApiClient>;

export class ApmApiError extends Error {
  res: ApiErrorResponse;

  constructor(res: request.Response, endpoint: string) {
    super(
      `Unhandled ApmApiError.
Status: "${res.status}"
Endpoint: "${endpoint}"
Body: ${JSON.stringify(res.body)}`
    );

    this.res = res;
  }
}

async function getApmApiClient({ svlSharedConfig }: { svlSharedConfig: Config }) {
  const kibanaServer = svlSharedConfig.get('servers.kibana');
  const cAuthorities = svlSharedConfig.get('servers.kibana.certificateAuthorities');

  const username = kbnTestConfig.getUrlParts(kibanaTestSuperuserServerless).username;
  const password = kbnTestConfig.getUrlParts(kibanaTestSuperuserServerless).password;

  const url = format({
    ...kibanaServer,
    auth: `${username}:${password}`,
  });

  return createApmApiClient(supertest.agent(url, { ca: cAuthorities }));
}

export interface SupertestReturnType<TEndpoint extends APIEndpoint> {
  status: number;
  body: APIReturnType<TEndpoint>;
}

type ApmApiClientKey = 'slsUser';
export type ApmApiClient = Record<ApmApiClientKey, Awaited<ReturnType<typeof getApmApiClient>>>;

export async function getApmApiClientService({
  getService,
}: InheritedFtrProviderContext): Promise<ApmApiClient> {
  const svlSharedConfig = getService('config');

  return {
    slsUser: await getApmApiClient({
      svlSharedConfig,
    }),
  };
}
