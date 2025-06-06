/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';
import { EuiButton, EuiCallOut, EuiSelect, EuiSpacer } from '@elastic/eui';
import type { Meta, StoryFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { useArgs } from '@storybook/preview-api';
import { AssetDetails } from './asset_details';
import { decorateWithGlobalStorybookThemeProviders } from '../../test_utils/use_global_storybook_theme';
import { type TabIds, type AssetDetailsProps } from './types';
import { DecorateWithKibanaContext } from './__stories__/decorator';
import { assetDetailsProps } from './__stories__/context/fixtures';

interface AssetDetailsStoryArgs extends AssetDetailsProps {
  tabId: TabIds;
}

const stories: Meta<AssetDetailsStoryArgs> = {
  title: 'infra/Asset Details View',
  decorators: [decorateWithGlobalStorybookThemeProviders, DecorateWithKibanaContext],
  component: AssetDetails,
  argTypes: {
    tabId: {
      options: assetDetailsProps.tabs.map(({ id }) => id),
      defaultValue: 'overview',
      control: {
        type: 'radio',
      },
    },
    links: {
      options: assetDetailsProps.links,
      control: {
        type: 'inline-check',
      },
    },
  },
  args: { ...assetDetailsProps },
};

const PageTabTemplate: StoryFn<AssetDetailsStoryArgs> = (args) => {
  return (
    <MemoryRouter initialEntries={[`/infra/metrics/hosts?assetDetails=(tabId:${args.tabId})`]}>
      <AssetDetails {...args} />
    </MemoryRouter>
  );
};

const FlyoutTemplate: StoryFn<AssetDetailsStoryArgs> = (args) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeFlyout = () => setIsOpen(false);
  const options = assetDetailsProps.tabs.map(({ id }) => id);
  const [{ tabId }, updateArgs] = useArgs();

  return (
    <div>
      <EuiCallOut
        color="warning"
        title={`To see different tab content please close the flyout if opened, select one of the options from the drop-down and open the flyout again:`}
      />
      <EuiSpacer />
      <EuiSelect
        data-test-subj="infraFlyoutTemplateSelect"
        value={tabId}
        onChange={(e) => {
          updateArgs({ tabId: e.target.value as TabIds });
        }}
        options={options.map((id) => ({
          text: id,
          value: id,
        }))}
      />
      <EuiSpacer />
      <EuiButton
        data-test-subj="infraFlyoutTemplateOpenFlyoutButton"
        onClick={() => setIsOpen(true)}
      >
        Open flyout
      </EuiButton>
      <div hidden={!isOpen}>
        {isOpen && (
          <MemoryRouter
            key={tabId}
            initialEntries={[`/infra/metrics/hosts?assetDetails=(tabId:${tabId ?? args?.tabId})`]}
          >
            <AssetDetails {...args} renderMode={{ mode: 'flyout', closeFlyout }} />
          </MemoryRouter>
        )}
      </div>
    </div>
  );
};

export const OverviewTab = {
  render: PageTabTemplate,
  args: { tabId: 'overview' },
};

export const MetadataTab = {
  render: PageTabTemplate,
  args: { tabId: 'metadata' },
};

export const ProcessesTab = {
  render: PageTabTemplate,
  args: { tabId: 'processes' },
};

export const LogsTab = {
  render: PageTabTemplate,
  args: { tabId: 'logs' },
};

export const AnomaliesTab = {
  render: PageTabTemplate,
  args: { tabId: 'anomalies' },
};

export const Flyout = {
  render: FlyoutTemplate,
};

export default stories;
