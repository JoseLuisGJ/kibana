/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act } from 'react-dom/test-utils';

import { API_BASE_PATH } from '../../../common/constants';
import type { MlAction } from '../../../common/types';
import { setupEnvironment } from '../helpers';
import { ElasticsearchTestBed, setupElasticsearchPage } from './es_deprecations.helpers';
import {
  esDeprecationsMockResponse,
  MOCK_SNAPSHOT_ID,
  MOCK_JOB_ID,
  createEsDeprecationsMockResponse,
} from './mocked_responses';

describe('ES deprecations table', () => {
  let testBed: ElasticsearchTestBed;
  let httpRequestsMockHelpers: ReturnType<typeof setupEnvironment>['httpRequestsMockHelpers'];
  let httpSetup: ReturnType<typeof setupEnvironment>['httpSetup'];
  beforeEach(async () => {
    const mockEnvironment = setupEnvironment();
    httpRequestsMockHelpers = mockEnvironment.httpRequestsMockHelpers;
    httpSetup = mockEnvironment.httpSetup;

    httpRequestsMockHelpers.setLoadEsDeprecationsResponse(esDeprecationsMockResponse);
    httpRequestsMockHelpers.setUpgradeMlSnapshotStatusResponse({
      nodeId: 'my_node',
      snapshotId: MOCK_SNAPSHOT_ID,
      jobId: MOCK_JOB_ID,
      status: 'idle',
    });
    httpRequestsMockHelpers.setReindexStatusResponse('reindex_index', {
      reindexOp: null,
      warnings: [],
      hasRequiredPrivileges: true,
      meta: {
        indexName: 'foo',
        reindexName: 'reindexed-foo',
        aliases: [],
      },
    });
    httpRequestsMockHelpers.setLoadRemoteClustersResponse([]);

    await act(async () => {
      testBed = await setupElasticsearchPage(httpSetup);
    });

    testBed.component.update();
  });

  it('renders deprecations', () => {
    const { exists, find } = testBed;
    // Verify container exists
    expect(exists('esDeprecationsContent')).toBe(true);

    // Verify all deprecations appear in the table
    expect(find('deprecationTableRow').length).toEqual(
      esDeprecationsMockResponse.migrationsDeprecations.length
    );
  });

  it('refreshes deprecation data', async () => {
    const { actions } = testBed;

    await actions.table.clickRefreshButton();

    const mlDeprecation = esDeprecationsMockResponse.migrationsDeprecations[0];
    const reindexDeprecation = esDeprecationsMockResponse.migrationsDeprecations[3];

    // Since upgradeStatusMockResponse includes ML and reindex actions (which require fetching status), there will be 4 requests made
    expect(httpSetup.get).toHaveBeenCalledWith(
      `${API_BASE_PATH}/es_deprecations`,
      expect.anything()
    );
    expect(httpSetup.get).toHaveBeenCalledWith(
      `${API_BASE_PATH}/ml_snapshots/${(mlDeprecation.correctiveAction as MlAction).jobId}/${
        (mlDeprecation.correctiveAction as MlAction).snapshotId
      }`,
      expect.anything()
    );
    expect(httpSetup.get).toHaveBeenCalledWith(
      `${API_BASE_PATH}/reindex/${reindexDeprecation.index}`,
      expect.anything()
    );

    expect(httpSetup.get).toHaveBeenCalledWith(
      `${API_BASE_PATH}/ml_upgrade_mode`,
      expect.anything()
    );
  });

  it('shows critical and warning deprecations count', () => {
    const { find } = testBed;
    const criticalDeprecations = esDeprecationsMockResponse.migrationsDeprecations.filter(
      (deprecation) => deprecation.level === 'critical'
    );
    const warningDeprecations = esDeprecationsMockResponse.migrationsDeprecations.filter(
      (deprecation) => deprecation.level !== 'critical'
    );

    expect(find('criticalDeprecationsCount').text()).toContain(String(criticalDeprecations.length));

    expect(find('warningDeprecationsCount').text()).toContain(String(warningDeprecations.length));
  });

  describe('remote clusters callout', () => {
    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadRemoteClustersResponse(['test_remote_cluster']);

      await act(async () => {
        testBed = await setupElasticsearchPage(httpSetup);
      });

      testBed.component.update();
    });

    it('shows a warning message if a user has remote clusters configured', () => {
      const { exists } = testBed;

      // Verify warning exists
      expect(exists('remoteClustersWarningCallout')).toBe(true);
    });
  });

  describe('search bar', () => {
    it('filters results by status', async () => {
      const { find, actions } = testBed;

      await actions.searchBar.clickStatusFilterDropdown();
      await actions.searchBar.clickFilterByTitle('Critical');

      const criticalDeprecations = esDeprecationsMockResponse.migrationsDeprecations.filter(
        (deprecation) => deprecation.level === 'critical'
      );

      expect(find('deprecationTableRow').length).toEqual(criticalDeprecations.length);

      await actions.searchBar.clickStatusFilterDropdown();
      await actions.searchBar.clickFilterByTitle('Critical'); // Reset filter

      expect(find('deprecationTableRow').length).toEqual(
        esDeprecationsMockResponse.migrationsDeprecations.length
      );
    });

    it('filters results by type', async () => {
      const { find, actions } = testBed;

      await actions.searchBar.clickTypeFilterDropdown();

      await actions.searchBar.clickFilterByTitle('Cluster');

      const clusterDeprecations = esDeprecationsMockResponse.migrationsDeprecations.filter(
        (deprecation) => deprecation.type === 'cluster_settings'
      );

      expect(find('deprecationTableRow').length).toEqual(clusterDeprecations.length);
    });

    it('filters results by query string', async () => {
      const { find, actions } = testBed;
      const multiFieldsDeprecation = esDeprecationsMockResponse.migrationsDeprecations[2];

      await actions.searchBar.setSearchInputValue(multiFieldsDeprecation.message);

      expect(find('deprecationTableRow').length).toEqual(1);
      expect(find('deprecationTableRow').at(0).text()).toContain(multiFieldsDeprecation.message);
    });

    it('shows error for invalid search queries', async () => {
      const { find, exists, actions } = testBed;

      await actions.searchBar.setSearchInputValue('%');

      expect(exists('invalidSearchQueryMessage')).toBe(true);
      expect(find('invalidSearchQueryMessage').text()).toContain('Invalid search');
    });

    it('shows message when search query does not return results', async () => {
      const { find, actions, exists } = testBed;

      await actions.searchBar.setSearchInputValue('foobarbaz');

      expect(exists('noDeprecationsRow')).toBe(true);
      expect(find('noDeprecationsRow').text()).toContain(
        'No Elasticsearch deprecation issues found'
      );
    });
  });

  describe('pagination', () => {
    const esDeprecationsMockResponseWithManyDeprecations = createEsDeprecationsMockResponse(20);
    const { migrationsDeprecations } = esDeprecationsMockResponseWithManyDeprecations;

    beforeEach(async () => {
      httpRequestsMockHelpers.setLoadEsDeprecationsResponse(
        esDeprecationsMockResponseWithManyDeprecations
      );
      httpRequestsMockHelpers.setUpgradeMlSnapshotStatusResponse({
        nodeId: 'my_node',
        snapshotId: MOCK_SNAPSHOT_ID,
        jobId: MOCK_JOB_ID,
        status: 'idle',
      });

      await act(async () => {
        testBed = await setupElasticsearchPage(httpSetup);
      });

      testBed.component.update();
    });

    it('shows the correct number of pages and deprecations per page', async () => {
      const { find, actions } = testBed;

      expect(find('esDeprecationsPagination').find('.euiPagination__item').length).toEqual(
        Math.round(migrationsDeprecations.length / 50) // Default rows per page is 50
      );
      expect(find('deprecationTableRow').length).toEqual(50);

      // Navigate to the next page
      await actions.pagination.clickPaginationAt(1);

      // On the second (last) page, we expect to see the remaining deprecations
      expect(find('deprecationTableRow').length).toEqual(migrationsDeprecations.length - 50);
    });

    it('allows the number of viewable rows to change', async () => {
      const { find, actions, component } = testBed;

      await actions.pagination.clickRowsPerPageDropdown();

      // We need to read the document "body" as the rows-per-page dropdown options are added there and not inside
      // the component DOM tree.
      const rowsPerPageButton: HTMLButtonElement | null = document.body.querySelector(
        '[data-test-subj="tablePagination-100-rows"]'
      );

      expect(rowsPerPageButton).not.toBeNull();

      await act(async () => {
        rowsPerPageButton!.click();
      });

      component.update();

      expect(find('esDeprecationsPagination').find('.euiPagination__item').length).toEqual(
        Math.round(migrationsDeprecations.length / 100) // Rows per page is now 100
      );
      expect(find('deprecationTableRow').length).toEqual(migrationsDeprecations.length);
    });

    it('updates pagination when filters change', async () => {
      const { actions, find } = testBed;

      const criticalDeprecations = migrationsDeprecations.filter(
        (deprecation) => deprecation.level === 'critical'
      );

      await actions.searchBar.clickStatusFilterDropdown();
      await actions.searchBar.clickFilterByTitle('Critical');

      // Only 40 critical deprecations, so only one page should show
      expect(find('esDeprecationsPagination').find('.euiPagination__item').length).toEqual(1);
      expect(find('deprecationTableRow').length).toEqual(criticalDeprecations.length);
    });

    it('updates pagination on search', async () => {
      const { actions, find } = testBed;
      const reindexDeprecations = migrationsDeprecations.filter(
        (deprecation) => deprecation.correctiveAction?.type === 'reindex'
      );

      await actions.searchBar.setSearchInputValue('Index created before 7.0');

      // Only 20 deprecations that match, so only one page should show
      expect(find('esDeprecationsPagination').find('.euiPagination__item').length).toEqual(1);
      expect(find('deprecationTableRow').length).toEqual(reindexDeprecations.length);
    });
  });

  describe('no deprecations', () => {
    beforeEach(async () => {
      const noDeprecationsResponse = {
        totalCriticalDeprecations: 0,
        migrationsDeprecations: [],
        totalCriticalHealthIssues: 0,
        enrichedHealthIndicators: [],
      };

      httpRequestsMockHelpers.setLoadEsDeprecationsResponse(noDeprecationsResponse);

      await act(async () => {
        testBed = await setupElasticsearchPage(httpSetup);
      });

      testBed.component.update();
    });

    test('renders prompt', () => {
      const { exists, find } = testBed;
      expect(exists('noDeprecationsPrompt')).toBe(true);
      expect(find('noDeprecationsPrompt').text()).toContain(
        'Your Elasticsearch configuration is up to date'
      );
    });
  });
});
