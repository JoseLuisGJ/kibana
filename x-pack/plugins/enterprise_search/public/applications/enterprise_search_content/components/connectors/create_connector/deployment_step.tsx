/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

// import { useLocation } from 'react-router-dom';
import {
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiTitle,
  EuiText,
  EuiButton,
  EuiFlexGroup,
} from '@elastic/eui';

import { i18n } from '@kbn/i18n';

import { ConnectorDeployment } from '../../connector_detail/deployment';

interface DeploymentStepProps {
  currentStep: number;
  isNextStepEnabled: boolean;
  setCurrentStep: Function;
  setNextStepEnabled: Function;
}

export const DeploymentStep: React.FC<DeploymentStepProps> = ({
  currentStep,
  setCurrentStep,
  isNextStepEnabled,
  setNextStepEnabled,
}) => {
  return (
    <EuiFlexGroup gutterSize="m" direction="column">
      <ConnectorDeployment />
      <EuiFlexItem>
        <EuiPanel hasShadow={false} hasBorder paddingSize="l">
          <EuiTitle size="m">
            <h3>
              {i18n.translate('xpack.enterpriseSearch.deploymentStep.h3.deploymentLabel', {
                defaultMessage: 'Deployment',
              })}
            </h3>
          </EuiTitle>
          <EuiSpacer size="m" />
          <EuiButton
            data-test-subj="enterpriseSearchStartStepGenerateConfigurationButton"
            onClick={() => setNextStepEnabled(true)}
          >
            {i18n.translate('xpack.enterpriseSearch.configurationStep.button.simulateSave', {
              defaultMessage: 'Save',
            })}
          </EuiButton>
        </EuiPanel>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiPanel
          hasShadow={false}
          hasBorder
          paddingSize="l"
          color={isNextStepEnabled ? 'plain' : 'subdued'}
        >
          <EuiText color={isNextStepEnabled ? 'default' : 'subdued'}>
            <h3>
              {i18n.translate('xpack.enterpriseSearch.DeploymentStep.Configuration.title', {
                defaultMessage: 'Configuration',
              })}
            </h3>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiText color={isNextStepEnabled ? 'default' : 'subdued'} size="s">
            <p>
              {i18n.translate('xpack.enterpriseSearch.DeploymentStep.Configuration.description', {
                defaultMessage: 'Now configure your Elastic crawler and sync the data.',
              })}
            </p>
          </EuiText>
          <EuiSpacer size="m" />
          <EuiButton
            data-test-subj="enterpriseSearchStartStepGenerateConfigurationButton"
            onClick={() => setCurrentStep(currentStep + 1)}
            fill
            disabled={!isNextStepEnabled}
          >
            {i18n.translate('xpack.enterpriseSearch.DeploymentStep.Configuration.button.continue', {
              defaultMessage: 'Contiue',
            })}
          </EuiButton>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
