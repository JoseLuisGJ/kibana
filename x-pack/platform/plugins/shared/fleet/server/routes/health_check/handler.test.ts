/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import fetch from 'node-fetch';

import { fleetServerHostService } from '../../services/fleet_server_host';

import { PostHealthCheckResponseSchema } from '../../types';

import { postHealthCheckHandler } from './handler';

jest.mock('node-fetch');

describe('Fleet server health_check handler', () => {
  const mockContext = {
    core: Promise.resolve({
      savedObjects: {},
      elasticsearch: {
        client: {},
      },
    }),
  } as any;
  const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockResponse = {
    customError: jest.fn().mockImplementation((options) => options),
    ok: jest.fn().mockImplementation((options) => {
      return { ...options, statusCode: 200 };
    }),
    badRequest: jest.fn().mockImplementation((options) => {
      return { ...options, statusCode: 400 };
    }),
    notFound: jest.fn().mockImplementation((options) => {
      return { ...options, statusCode: 404 };
    }),
  };

  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it('should return a bad request error if the requested fleet server host has no host_urls', async () => {
    jest.spyOn(fleetServerHostService, 'get').mockResolvedValue({
      id: 'default-fleet-server',
      name: 'Default',
      is_default: true,
      host_urls: [],
    } as any);

    const res = await postHealthCheckHandler(
      mockContext,
      { body: { id: 'default-fleet-server' } } as any,
      mockResponse as any
    );

    expect(res).toEqual({
      body: {
        message: `The requested host id default-fleet-server does not have associated host urls.`,
      },
      statusCode: 400,
    });
  });

  it('should return 200 and active status when fetch response is `active`', async () => {
    const activeRes = {
      status: 'ONLINE',
      host_id: 'default-fleet-server',
      name: 'Default',
    };

    jest.spyOn(fleetServerHostService, 'get').mockResolvedValue({
      id: 'default-fleet-server',
      name: 'Default',
      is_default: true,
      host_urls: ['https://localhost:8220'],
    } as any);

    mockedFetch.mockResolvedValueOnce({
      json: () => activeRes,
      status: 200,
      ok: true,
    } as any);

    const res = await postHealthCheckHandler(
      mockContext,
      { body: { id: 'default-fleet-server' } } as any,
      mockResponse as any
    );

    const expectedResponse = {
      host_id: 'default-fleet-server',
      name: 'Default',
      status: 'ONLINE',
    };
    expect(res).toEqual({
      body: expectedResponse,
      statusCode: 200,
    });

    const validateResp = PostHealthCheckResponseSchema.validate(expectedResponse);
    expect(validateResp).toEqual(expectedResponse);
  });

  it('should return an error when host id is not found', async () => {
    jest
      .spyOn(fleetServerHostService, 'get')
      .mockRejectedValue({ output: { statusCode: 404 }, isBoom: true });

    const res = await postHealthCheckHandler(
      mockContext,
      { body: { id: 'non-existent' } } as any,
      mockResponse as any
    );

    expect(res).toEqual({
      body: {
        message: `The requested host id non-existent does not exist.`,
      },
      statusCode: 404,
    });
  });

  it('should return status `offline` when fetch request gets aborted', async () => {
    jest.spyOn(fleetServerHostService, 'get').mockResolvedValue({
      id: 'default-fleet-server',
      name: 'Default',
      is_default: true,
      host_urls: ['https://localhost:8220'],
    } as any);
    mockedFetch.mockRejectedValue({ message: 'user aborted', name: 'AbortError' });

    const res = await postHealthCheckHandler(
      mockContext,
      { body: { id: 'default-fleet-server' } } as any,
      mockResponse as any
    );

    const expectedResponse = {
      host_id: 'default-fleet-server',
      status: 'OFFLINE',
    };
    expect(res).toEqual({
      body: expectedResponse,
      statusCode: 200,
    });
    const validateResp = PostHealthCheckResponseSchema.validate(expectedResponse);
    expect(validateResp).toEqual(expectedResponse);
  });
});
