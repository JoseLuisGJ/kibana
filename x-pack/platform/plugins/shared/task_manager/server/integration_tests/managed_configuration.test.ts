/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import sinon from 'sinon';
import { Client } from '@elastic/elasticsearch';
import { elasticsearchServiceMock, savedObjectsRepositoryMock } from '@kbn/core/server/mocks';
import { SavedObjectsErrorHelpers, Logger } from '@kbn/core/server';
import { ADJUST_THROUGHPUT_INTERVAL } from '../lib/create_managed_configuration';
import { TaskManagerPlugin, TaskManagerStartContract } from '../plugin';
import { coreMock } from '@kbn/core/server/mocks';
import { TaskManagerConfig } from '../config';
import { BulkUpdateError } from '../lib/bulk_update_error';

describe('managed configuration', () => {
  let taskManagerStart: TaskManagerStartContract;
  let logger: Logger;

  let clock: sinon.SinonFakeTimers;
  const savedObjectsClient = savedObjectsRepositoryMock.create();
  const esStart = elasticsearchServiceMock.createStart();

  const inlineScriptError = new Error('cannot execute [inline] scripts" error') as Error & {
    meta: unknown;
  };
  inlineScriptError.meta = {
    body: {
      error: {
        caused_by: {
          reason: 'cannot execute [inline] scripts',
        },
      },
    },
  };

  afterEach(() => clock.restore());

  describe('managed poll interval', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
      clock = sinon.useFakeTimers();

      const context = coreMock.createPluginInitializerContext<TaskManagerConfig>({
        discovery: {
          active_nodes_lookback: '30s',
          interval: 10000,
        },
        kibanas_per_partition: 2,
        capacity: 10,
        max_attempts: 9,
        poll_interval: 3000,
        allow_reading_invalid_state: false,
        version_conflict_threshold: 80,
        monitored_aggregated_stats_refresh_rate: 60000,
        monitored_stats_health_verbose_log: {
          enabled: false,
          level: 'debug' as const,
          warn_delayed_task_start_in_seconds: 60,
        },
        monitored_stats_required_freshness: 4000,
        monitored_stats_running_average_window: 50,
        request_capacity: 1000,
        monitored_task_execution_thresholds: {
          default: {
            error_threshold: 90,
            warn_threshold: 80,
          },
          custom: {},
        },
        unsafe: {
          exclude_task_types: [],
          authenticate_background_task_utilization: true,
        },
        event_loop_delay: {
          monitor: true,
          warn_threshold: 5000,
        },
        worker_utilization_running_average_window: 5,
        metrics_reset_interval: 3000,
        claim_strategy: 'update_by_query',
        request_timeouts: {
          update_by_query: 1000,
        },
        auto_calculate_default_ech_capacity: false,
      });
      logger = context.logger.get('taskManager');

      const taskManager = new TaskManagerPlugin(context);
      (
        await taskManager.setup(coreMock.createSetup(), { usageCollection: undefined })
      ).registerTaskDefinitions({
        foo: {
          title: 'Foo',
          createTaskRunner: jest.fn(),
        },
      });

      const coreStart = coreMock.createStart();
      coreStart.elasticsearch = esStart;
      esStart.client.asInternalUser.child.mockReturnValue(
        esStart.client.asInternalUser as unknown as Client
      );
      coreStart.savedObjects.createInternalRepository.mockReturnValue(savedObjectsClient);
      taskManagerStart = await taskManager.start(coreStart, {});

      // force rxjs timers to fire when they are scheduled for setTimeout(0) as the
      // sinon fake timers cause them to stall
      clock.tick(0);
    });

    test('should increase poll interval when Elasticsearch returns 429 error', async () => {
      savedObjectsClient.create.mockRejectedValueOnce(
        SavedObjectsErrorHelpers.createTooManyRequestsError('a', 'b')
      );

      // Cause "too many requests" error to be thrown
      await expect(
        taskManagerStart.schedule({
          taskType: 'foo',
          state: {},
          params: {},
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Too Many Requests"`);
      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Poll interval configuration is temporarily increased after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Poll interval configuration changing from 3000 to 3600 after seeing 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith('Task poller now using interval of 3600ms');
    });

    test('should increase poll interval when Elasticsearch returns a cluster_block_exception error', async () => {
      savedObjectsClient.create.mockRejectedValueOnce(
        new BulkUpdateError({
          statusCode: 403,
          message: 'index is blocked',
          type: 'cluster_block_exception',
        })
      );

      await expect(
        taskManagerStart.schedule({
          taskType: 'foo',
          state: {},
          params: {},
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"index is blocked"`);
      clock.tick(100000);

      expect(logger.warn).toHaveBeenCalledWith(
        'Poll interval configuration is temporarily increased after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Poll interval configuration changing from 3000 to 61000 after seeing 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith('Task poller now using interval of 61000ms');
    });

    test('should increase poll interval when Elasticsearch returns "cannot execute [inline] scripts" error', async () => {
      const childEsClient = esStart.client.asInternalUser.child({}) as jest.Mocked<Client>;
      childEsClient.search.mockImplementationOnce(async () => {
        throw inlineScriptError;
      });

      await expect(taskManagerStart.fetch({})).rejects.toThrowErrorMatchingInlineSnapshot(
        `"cannot execute [inline] scripts\\" error"`
      );

      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Poll interval configuration is temporarily increased after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Poll interval configuration changing from 3000 to 3600 after seeing 1 "too many request" and/or "execute [inline] script" and/or "cluster_block_exception" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith('Task poller now using interval of 3600ms');
    });
  });

  describe('managed capacity with default claim strategy', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
      clock = sinon.useFakeTimers();

      const context = coreMock.createPluginInitializerContext<TaskManagerConfig>({
        discovery: {
          active_nodes_lookback: '30s',
          interval: 10000,
        },
        kibanas_per_partition: 2,
        capacity: 10,
        max_attempts: 9,
        poll_interval: 3000,
        allow_reading_invalid_state: false,
        version_conflict_threshold: 80,
        monitored_aggregated_stats_refresh_rate: 60000,
        monitored_stats_health_verbose_log: {
          enabled: false,
          level: 'debug' as const,
          warn_delayed_task_start_in_seconds: 60,
        },
        monitored_stats_required_freshness: 4000,
        monitored_stats_running_average_window: 50,
        request_capacity: 1000,
        monitored_task_execution_thresholds: {
          default: {
            error_threshold: 90,
            warn_threshold: 80,
          },
          custom: {},
        },
        unsafe: {
          exclude_task_types: [],
          authenticate_background_task_utilization: true,
        },
        event_loop_delay: {
          monitor: true,
          warn_threshold: 5000,
        },
        worker_utilization_running_average_window: 5,
        metrics_reset_interval: 3000,
        claim_strategy: 'update_by_query',
        request_timeouts: {
          update_by_query: 1000,
        },
        auto_calculate_default_ech_capacity: false,
      });
      logger = context.logger.get('taskManager');

      const taskManager = new TaskManagerPlugin(context);
      (
        await taskManager.setup(coreMock.createSetup(), { usageCollection: undefined })
      ).registerTaskDefinitions({
        foo: {
          title: 'Foo',
          createTaskRunner: jest.fn(),
        },
      });

      const coreStart = coreMock.createStart();
      coreStart.elasticsearch = esStart;
      esStart.client.asInternalUser.child.mockReturnValue(
        esStart.client.asInternalUser as unknown as Client
      );
      coreStart.savedObjects.createInternalRepository.mockReturnValue(savedObjectsClient);
      taskManagerStart = await taskManager.start(coreStart, {});

      // force rxjs timers to fire when they are scheduled for setTimeout(0) as the
      // sinon fake timers cause them to stall
      clock.tick(0);
    });

    test('should lower capacity when Elasticsearch returns 429 error', async () => {
      savedObjectsClient.create.mockRejectedValueOnce(
        SavedObjectsErrorHelpers.createTooManyRequestsError('a', 'b')
      );

      // Cause "too many requests" error to be thrown
      await expect(
        taskManagerStart.schedule({
          taskType: 'foo',
          state: {},
          params: {},
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Too Many Requests"`);
      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Capacity configuration is temporarily reduced after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Capacity configuration changing from 10 to 8 after seeing 1 "too many request" and/or "execute [inline] script" error(s)'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Task pool now using 10 as the max worker value which is based on a capacity of 10'
      );
    });

    test('should lower capacity when Elasticsearch returns "cannot execute [inline] scripts" error', async () => {
      const childEsClient = esStart.client.asInternalUser.child({}) as jest.Mocked<Client>;
      childEsClient.search.mockImplementationOnce(async () => {
        throw inlineScriptError;
      });

      await expect(taskManagerStart.fetch({})).rejects.toThrowErrorMatchingInlineSnapshot(
        `"cannot execute [inline] scripts\\" error"`
      );
      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Capacity configuration is temporarily reduced after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Capacity configuration changing from 10 to 8 after seeing 1 "too many request" and/or "execute [inline] script" error(s)'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Task pool now using 10 as the max worker value which is based on a capacity of 10'
      );
    });
  });

  describe('managed capacity with mget claim strategy', () => {
    beforeEach(async () => {
      jest.resetAllMocks();
      clock = sinon.useFakeTimers();

      const context = coreMock.createPluginInitializerContext<TaskManagerConfig>({
        discovery: {
          active_nodes_lookback: '30s',
          interval: 10000,
        },
        kibanas_per_partition: 2,
        capacity: 10,
        max_attempts: 9,
        poll_interval: 3000,
        allow_reading_invalid_state: false,
        version_conflict_threshold: 80,
        monitored_aggregated_stats_refresh_rate: 60000,
        monitored_stats_health_verbose_log: {
          enabled: false,
          level: 'debug' as const,
          warn_delayed_task_start_in_seconds: 60,
        },
        monitored_stats_required_freshness: 4000,
        monitored_stats_running_average_window: 50,
        request_capacity: 1000,
        monitored_task_execution_thresholds: {
          default: {
            error_threshold: 90,
            warn_threshold: 80,
          },
          custom: {},
        },
        unsafe: {
          exclude_task_types: [],
          authenticate_background_task_utilization: true,
        },
        event_loop_delay: {
          monitor: true,
          warn_threshold: 5000,
        },
        worker_utilization_running_average_window: 5,
        metrics_reset_interval: 3000,
        claim_strategy: 'mget',
        request_timeouts: {
          update_by_query: 1000,
        },
        auto_calculate_default_ech_capacity: false,
      });
      logger = context.logger.get('taskManager');

      const taskManager = new TaskManagerPlugin(context);
      (
        await taskManager.setup(coreMock.createSetup(), { usageCollection: undefined })
      ).registerTaskDefinitions({
        foo: {
          title: 'Foo',
          createTaskRunner: jest.fn(),
        },
      });

      const coreStart = coreMock.createStart();
      coreStart.elasticsearch = esStart;
      esStart.client.asInternalUser.child.mockReturnValue(
        esStart.client.asInternalUser as unknown as Client
      );
      coreStart.savedObjects.createInternalRepository.mockReturnValue(savedObjectsClient);
      taskManagerStart = await taskManager.start(coreStart, {});

      // force rxjs timers to fire when they are scheduled for setTimeout(0) as the
      // sinon fake timers cause them to stall
      clock.tick(0);
    });

    test('should lower capacity when Elasticsearch returns 429 error', async () => {
      savedObjectsClient.create.mockRejectedValueOnce(
        SavedObjectsErrorHelpers.createTooManyRequestsError('a', 'b')
      );

      // Cause "too many requests" error to be thrown
      await expect(
        taskManagerStart.schedule({
          taskType: 'foo',
          state: {},
          params: {},
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"Too Many Requests"`);
      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Capacity configuration is temporarily reduced after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Capacity configuration changing from 10 to 8 after seeing 1 "too many request" and/or "execute [inline] script" error(s)'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Task pool now using 20 as the max allowed cost which is based on a capacity of 10'
      );
    });

    test('should lower capacity when Elasticsearch returns "cannot execute [inline] scripts" error', async () => {
      const childEsClient = esStart.client.asInternalUser.child({}) as jest.Mocked<Client>;
      childEsClient.search.mockImplementationOnce(async () => {
        throw inlineScriptError;
      });

      await expect(taskManagerStart.fetch({})).rejects.toThrowErrorMatchingInlineSnapshot(
        `"cannot execute [inline] scripts\\" error"`
      );
      clock.tick(ADJUST_THROUGHPUT_INTERVAL);

      expect(logger.warn).toHaveBeenCalledWith(
        'Capacity configuration is temporarily reduced after Elasticsearch returned 1 "too many request" and/or "execute [inline] script" error(s).'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Capacity configuration changing from 10 to 8 after seeing 1 "too many request" and/or "execute [inline] script" error(s)'
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Task pool now using 20 as the max allowed cost which is based on a capacity of 10'
      );
    });
  });
});
