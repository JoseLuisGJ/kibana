/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React, { useState } from 'react';

import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';

import connectorLogo from '../../../../../../assets/images/connector_logo_network_drive_version.svg';

const nativePopoverPanels = [
  {
    description: i18n.translate(
      'xpack.enterpriseSearch.connectorDescriptionBadge.native.chooseADataSourceLabel',
      { defaultMessage: "Choose a data source you'd like to sync" }
    ),
    icons: [<EuiIcon type="documents" />],
    id: 'native-choose-source',
  },
  {
    description: i18n.translate(
      'xpack.enterpriseSearch.connectorDescriptionBadge.native.configureConnectorLabel',
      { defaultMessage: 'Configure your connector using our Kibana UI' }
    ),
    icons: [<EuiIcon type={connectorLogo} />, <EuiIcon type="logoElastic" />],
    id: 'native-configure-connector',
  },
];

const connectorClientPopoverPanels = [
  {
    description: i18n.translate(
      'xpack.enterpriseSearch.connectorDescriptionBadge.client.chooseADataSourceLabel',
      { defaultMessage: "Choose a data source you'd like to sync" }
    ),
    icons: [<EuiIcon type="documents" />],
    id: 'client-choose-source',
  },
  {
    description: i18n.translate(
      'xpack.enterpriseSearch.connectorDescriptionBadge.client.configureConnectorLabel',
      {
        defaultMessage:
          'Deploy connector code on your own infrastructure by running from source, or using Docker',
      }
    ),
    icons: [
      <EuiIcon type={connectorLogo} />,
      <EuiIcon type="sortRight" />,
      <EuiIcon type="launch" />,
    ],
    id: 'client-deploy',
  },
  {
    description: i18n.translate(
      'xpack.enterpriseSearch.connectorDescriptionBadge.client.enterDetailsLabel',
      {
        defaultMessage: 'Enter access and connection details for your data source',
      }
    ),
    icons: [
      <EuiIcon type="documents" />,
      <EuiIcon type="sortRight" />,
      <EuiIcon type={connectorLogo} />,
      <EuiIcon type="sortRight" />,
      <EuiIcon type="logoElastic" />,
    ],
    id: 'client-configure-connector',
  },
];

export interface ConnectorDescriptionPopoverProps {
  isNative: boolean;
}

export const ConnectorDescriptionPopover: React.FC<ConnectorDescriptionPopoverProps> = ({
  isNative,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const panels = isNative ? nativePopoverPanels : connectorClientPopoverPanels;
  return (
    <EuiPopover
      anchorPosition="upCenter"
      button={
        <EuiButtonIcon
          iconType="iInCircle"
          onClick={() => setIsPopoverOpen(() => !isPopoverOpen)}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={() => {
        setIsPopoverOpen(false);
      }}
    >
      <EuiPanel hasBorder={false} hasShadow={false}>
        <EuiFlexGroup>
          {panels.map((panel) => {
            return (
              <EuiFlexItem grow={false} key={panel.id}>
                <EuiFlexGroup
                  direction="column"
                  alignItems="center"
                  gutterSize="s"
                  style={{ maxWidth: 200 }}
                >
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup responsive={false} gutterSize="s">
                      {panel.icons.map((icon, index) => (
                        <EuiFlexItem grow={false} key={index}>
                          {icon}
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s" grow={false} textAlign="center">
                      <p>{panel.description}</p>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiPopover>
  );
};
