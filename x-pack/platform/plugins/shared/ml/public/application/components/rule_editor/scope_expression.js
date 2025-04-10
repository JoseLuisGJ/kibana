/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * React component for rendering a rule scope expression.
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';

import {
  EuiCheckbox,
  EuiExpression,
  EuiPopoverTitle,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPopover,
  EuiSelect,
} from '@elastic/eui';

import { ML_DETECTOR_RULE_FILTER_TYPE } from '@kbn/ml-anomaly-utils';
import { FormattedMessage } from '@kbn/i18n-react';

import { filterTypeToText } from './utils';

function getFilterListOptions(filterListIds) {
  return filterListIds.map((filterId) => ({ value: filterId, text: filterId }));
}

export class ScopeExpression extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isFilterListOpen: false,
    };
  }

  openFilterList = () => {
    this.setState({
      isFilterListOpen: true,
    });
  };

  closeFilterList = () => {
    this.setState({
      isFilterListOpen: false,
    });
  };

  onChangeFilterType = (event) => {
    const { fieldName, filterId, enabled, updateScope } = this.props;

    updateScope(fieldName, filterId, event.target.value, enabled);
  };

  onChangeFilterId = (event) => {
    const { fieldName, filterType, enabled, updateScope } = this.props;

    updateScope(fieldName, event.target.value, filterType, enabled);
  };

  onEnableChange = (event) => {
    const { fieldName, filterId, filterType, updateScope } = this.props;

    updateScope(fieldName, filterId, filterType, event.target.checked);
  };

  renderFilterListPopover() {
    const { filterId, filterType, filterListIds } = this.props;

    return (
      <div>
        <EuiPopoverTitle>
          <FormattedMessage
            id="xpack.ml.ruleEditor.scopeExpression.scopeFilterTypePopoverTitle"
            defaultMessage="Is"
          />
        </EuiPopoverTitle>
        <div className="euiExpression">
          <EuiFlexGroup style={{ maxWidth: 450 }}>
            <EuiFlexItem grow={false} style={{ width: 150 }}>
              <EuiSelect
                value={filterType}
                onChange={this.onChangeFilterType}
                options={[
                  {
                    value: ML_DETECTOR_RULE_FILTER_TYPE.INCLUDE,
                    text: filterTypeToText(ML_DETECTOR_RULE_FILTER_TYPE.INCLUDE),
                  },
                  {
                    value: ML_DETECTOR_RULE_FILTER_TYPE.EXCLUDE,
                    text: filterTypeToText(ML_DETECTOR_RULE_FILTER_TYPE.EXCLUDE),
                  },
                ]}
              />
            </EuiFlexItem>

            <EuiFlexItem grow={false} style={{ width: 300 }}>
              <EuiSelect
                value={filterId}
                onChange={this.onChangeFilterId}
                options={getFilterListOptions(filterListIds)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
      </div>
    );
  }

  render() {
    const { fieldName, filterId, filterType, enabled, filterListIds } = this.props;

    return (
      <EuiFlexGroup gutterSize="m" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiCheckbox
            id={`scope_cb_${fieldName}`}
            checked={enabled}
            onChange={this.onEnableChange}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiExpression
            description={
              <FormattedMessage
                id="xpack.ml.ruleEditor.scopeExpression.scopeFieldWhenLabel"
                defaultMessage="when"
              />
            }
            value={fieldName}
            isActive={false}
            css={{
              pointerEvents: 'none',
            }}
            onClick={(event) => event.preventDefault()}
          />
        </EuiFlexItem>

        {filterListIds !== undefined && filterListIds.length > 0 && (
          <EuiFlexItem grow={false}>
            <EuiPopover
              id="operatorValuePopover"
              button={
                <EuiExpression
                  description={
                    <FormattedMessage
                      id="xpack.ml.ruleEditor.scopeExpression.scopeFilterTypeButtonLabel"
                      defaultMessage="is {filterType}"
                      values={{ filterType: filterTypeToText(filterType) }}
                    />
                  }
                  value={filterId || ''}
                  isActive={this.state.isFilterListOpen}
                  onClick={this.openFilterList}
                />
              }
              isOpen={this.state.isFilterListOpen}
              closePopover={this.closeFilterList}
              panelPaddingSize="s"
              ownFocus
              anchorPosition="downLeft"
            >
              {this.renderFilterListPopover()}
            </EuiPopover>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }
}
ScopeExpression.propTypes = {
  fieldName: PropTypes.string.isRequired,
  filterId: PropTypes.string,
  filterType: PropTypes.oneOf([
    ML_DETECTOR_RULE_FILTER_TYPE.INCLUDE,
    ML_DETECTOR_RULE_FILTER_TYPE.EXCLUDE,
  ]),
  enabled: PropTypes.bool.isRequired,
  filterListIds: PropTypes.array.isRequired,
  updateScope: PropTypes.func.isRequired,
};
