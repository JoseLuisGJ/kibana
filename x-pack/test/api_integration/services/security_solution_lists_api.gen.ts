/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Lists API client for tests
 *   version: Bundle (no version)
 */

import {
  ELASTIC_HTTP_VERSION_HEADER,
  X_ELASTIC_INTERNAL_ORIGIN_REQUEST,
} from '@kbn/core-http-common';

import { CreateListRequestBodyInput } from '@kbn/securitysolution-lists-common/api/create_list/create_list.gen';
import { CreateListItemRequestBodyInput } from '@kbn/securitysolution-lists-common/api/create_list_item/create_list_item.gen';
import { DeleteListRequestQueryInput } from '@kbn/securitysolution-lists-common/api/delete_list/delete_list.gen';
import { DeleteListItemRequestQueryInput } from '@kbn/securitysolution-lists-common/api/delete_list_item/delete_list_item.gen';
import { ExportListItemsRequestQueryInput } from '@kbn/securitysolution-lists-common/api/export_list_items/export_list_items.gen';
import { FindListItemsRequestQueryInput } from '@kbn/securitysolution-lists-common/api/find_list_items/find_list_items.gen';
import { FindListsRequestQueryInput } from '@kbn/securitysolution-lists-common/api/find_lists/find_lists.gen';
import { ImportListItemsRequestQueryInput } from '@kbn/securitysolution-lists-common/api/import_list_items/import_list_items.gen';
import { PatchListRequestBodyInput } from '@kbn/securitysolution-lists-common/api/patch_list/patch_list.gen';
import { PatchListItemRequestBodyInput } from '@kbn/securitysolution-lists-common/api/patch_list_item/patch_list_item.gen';
import { ReadListRequestQueryInput } from '@kbn/securitysolution-lists-common/api/read_list/read_list.gen';
import { ReadListItemRequestQueryInput } from '@kbn/securitysolution-lists-common/api/read_list_item/read_list_item.gen';
import { UpdateListRequestBodyInput } from '@kbn/securitysolution-lists-common/api/update_list/update_list.gen';
import { UpdateListItemRequestBodyInput } from '@kbn/securitysolution-lists-common/api/update_list_item/update_list_item.gen';
import { routeWithNamespace } from '../../common/utils/security_solution';
import { FtrProviderContext } from '../ftr_provider_context';

export function SecuritySolutionApiProvider({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');

  return {
    /**
     * Create a new value list.
     */
    createList(props: CreateListProps, kibanaSpace: string = 'default') {
      return supertest
        .post(routeWithNamespace('/api/lists', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
    /**
     * Create `.lists` and `.items` data streams in the relevant space.
     */
    createListIndex(kibanaSpace: string = 'default') {
      return supertest
        .post(routeWithNamespace('/api/lists/index', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana');
    },
    /**
      * Create a value list item and associate it with the specified value list.

All value list items in the same list must be the same type. For example, each list item in an `ip` list must define a specific IP address.
> info
> Before creating a list item, you must create a list.

      */
    createListItem(props: CreateListItemProps, kibanaSpace: string = 'default') {
      return supertest
        .post(routeWithNamespace('/api/lists/items', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
    /**
      * Delete a value list using the list ID.
> info
> When you delete a list, all of its list items are also deleted.

      */
    deleteList(props: DeleteListProps, kibanaSpace: string = 'default') {
      return supertest
        .delete(routeWithNamespace('/api/lists', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Delete the `.lists` and `.items` data streams.
     */
    deleteListIndex(kibanaSpace: string = 'default') {
      return supertest
        .delete(routeWithNamespace('/api/lists/index', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana');
    },
    /**
     * Delete a value list item using its `id`, or its `list_id` and `value` fields.
     */
    deleteListItem(props: DeleteListItemProps, kibanaSpace: string = 'default') {
      return supertest
        .delete(routeWithNamespace('/api/lists/items', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Export list item values from the specified value list.
     */
    exportListItems(props: ExportListItemsProps, kibanaSpace: string = 'default') {
      return supertest
        .post(routeWithNamespace('/api/lists/items/_export', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Get all value list items in the specified list.
     */
    findListItems(props: FindListItemsProps, kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists/items/_find', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Get a paginated subset of value lists. By default, the first page is returned, with 20 results per page.
     */
    findLists(props: FindListsProps, kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists/_find', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
      * Import value list items from a TXT or CSV file. The maximum file size is 9 million bytes.

You can import items to a new or existing list.

      */
    importListItems(props: ImportListItemsProps, kibanaSpace: string = 'default') {
      return supertest
        .post(routeWithNamespace('/api/lists/items/_import', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Update specific fields of an existing list using the list `id`.
     */
    patchList(props: PatchListProps, kibanaSpace: string = 'default') {
      return supertest
        .patch(routeWithNamespace('/api/lists', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
    /**
     * Update specific fields of an existing value list item using the item `id`.
     */
    patchListItem(props: PatchListItemProps, kibanaSpace: string = 'default') {
      return supertest
        .patch(routeWithNamespace('/api/lists/items', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
    /**
     * Get the details of a value list using the list ID.
     */
    readList(props: ReadListProps, kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    /**
     * Verify that `.lists` and `.items` data streams exist.
     */
    readListIndex(kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists/index', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana');
    },
    /**
     * Get the details of a value list item.
     */
    readListItem(props: ReadListItemProps, kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists/items', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .query(props.query);
    },
    readListPrivileges(kibanaSpace: string = 'default') {
      return supertest
        .get(routeWithNamespace('/api/lists/privileges', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana');
    },
    /**
      * Update a value list using the list `id`. The original list is replaced, and all unspecified fields are deleted.
> info
> You cannot modify the `id` value.

      */
    updateList(props: UpdateListProps, kibanaSpace: string = 'default') {
      return supertest
        .put(routeWithNamespace('/api/lists', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
    /**
      * Update a value list item using the list item ID. The original list item is replaced, and all unspecified fields are deleted.
> info
> You cannot modify the `id` value.

      */
    updateListItem(props: UpdateListItemProps, kibanaSpace: string = 'default') {
      return supertest
        .put(routeWithNamespace('/api/lists/items', kibanaSpace))
        .set('kbn-xsrf', 'true')
        .set(ELASTIC_HTTP_VERSION_HEADER, '2023-10-31')
        .set(X_ELASTIC_INTERNAL_ORIGIN_REQUEST, 'kibana')
        .send(props.body as object);
    },
  };
}

export interface CreateListProps {
  body: CreateListRequestBodyInput;
}
export interface CreateListItemProps {
  body: CreateListItemRequestBodyInput;
}
export interface DeleteListProps {
  query: DeleteListRequestQueryInput;
}
export interface DeleteListItemProps {
  query: DeleteListItemRequestQueryInput;
}
export interface ExportListItemsProps {
  query: ExportListItemsRequestQueryInput;
}
export interface FindListItemsProps {
  query: FindListItemsRequestQueryInput;
}
export interface FindListsProps {
  query: FindListsRequestQueryInput;
}
export interface ImportListItemsProps {
  query: ImportListItemsRequestQueryInput;
}
export interface PatchListProps {
  body: PatchListRequestBodyInput;
}
export interface PatchListItemProps {
  body: PatchListItemRequestBodyInput;
}
export interface ReadListProps {
  query: ReadListRequestQueryInput;
}
export interface ReadListItemProps {
  query: ReadListItemRequestQueryInput;
}
export interface UpdateListProps {
  body: UpdateListRequestBodyInput;
}
export interface UpdateListItemProps {
  body: UpdateListItemRequestBodyInput;
}
