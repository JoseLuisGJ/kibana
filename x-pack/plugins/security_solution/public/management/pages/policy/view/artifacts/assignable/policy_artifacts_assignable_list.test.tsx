/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import type { PolicyArtifactsAssignableListProps } from './policy_artifacts_assignable_list';
import { PolicyArtifactsAssignableList } from './policy_artifacts_assignable_list';
import * as reactTestingLibrary from '@testing-library/react';
import type { AppContextTestRender } from '../../../../../../common/mock/endpoint';
import { createAppRootMockRenderer } from '../../../../../../common/mock/endpoint';
import { fireEvent } from '@testing-library/react';
import { getMockListResponse } from '../../../test_utils';

describe('Policy artifacts list', () => {
  let mockedContext: AppContextTestRender;
  let selectedArtifactsUpdatedMock: jest.Mock;
  let render: (
    props: PolicyArtifactsAssignableListProps
  ) => ReturnType<AppContextTestRender['render']>;
  const act = reactTestingLibrary.act;

  afterEach(() => reactTestingLibrary.cleanup());
  beforeEach(() => {
    selectedArtifactsUpdatedMock = jest.fn();
    mockedContext = createAppRootMockRenderer();
    render = (props) => mockedContext.render(<PolicyArtifactsAssignableList {...props} />);
  });

  it('should artifacts list loading state', async () => {
    const emptyArtifactsResponse = { data: [], per_page: 0, page: 0, total: 0 };
    const component = render({
      artifacts: emptyArtifactsResponse,
      selectedArtifactIds: [],
      isListLoading: true,
      selectedArtifactsUpdated: selectedArtifactsUpdatedMock,
      CardDecorator: undefined,
    });

    expect(component.getByTestId('artifactsAssignableListLoader')).not.toBeNull();
  });

  it('should artifacts list without data', async () => {
    const emptyArtifactsResponse = { data: [], per_page: 0, page: 0, total: 0 };
    const component = render({
      artifacts: emptyArtifactsResponse,
      selectedArtifactIds: [],
      isListLoading: false,
      selectedArtifactsUpdated: selectedArtifactsUpdatedMock,
      CardDecorator: undefined,
    });
    expect(component.queryByTestId('artifactsList')).toBeNull();
  });

  it('should artifacts list with data', async () => {
    const artifactsResponse = getMockListResponse();
    const component = render({
      artifacts: artifactsResponse,
      selectedArtifactIds: [],
      isListLoading: false,
      selectedArtifactsUpdated: selectedArtifactsUpdatedMock,
      CardDecorator: undefined,
    });
    expect(component.getByTestId('artifactsList')).not.toBeNull();
  });

  it('should select an artifact from list', async () => {
    const artifactsResponse = getMockListResponse();
    const component = render({
      artifacts: artifactsResponse,
      selectedArtifactIds: [artifactsResponse.data[0].id],
      isListLoading: false,
      selectedArtifactsUpdated: selectedArtifactsUpdatedMock,
      CardDecorator: undefined,
    });
    const tACardCheckbox = component.getByTestId(`${getMockListResponse().data[1].name}_checkbox`);

    await act(async () => {
      fireEvent.click(tACardCheckbox);
    });

    expect(selectedArtifactsUpdatedMock).toHaveBeenCalledWith(artifactsResponse.data[1].id, true);
  });
});
