/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React, { useContext } from 'react';
import type { EuiComboBoxOptionOption } from '@elastic/eui';
import type { Field } from '@kbn/ml-anomaly-utils';
import { OptionListWithFieldStats, useFieldStatsTrigger } from '@kbn/ml-field-stats-flyout';

import { JobCreatorContext } from '../../../job_creator_context';
import {
  createFieldOptions,
  createDocCountFieldOption,
} from '../../../../../common/job_creator/util/general';

interface Props {
  fields: Field[];
  changeHandler(i: string | null): void;
  selectedField: string | null;
  titleId: string;
}

export const SummaryCountFieldSelect: FC<Props> = ({
  fields,
  changeHandler,
  selectedField,
  titleId,
}) => {
  const { jobCreator } = useContext(JobCreatorContext);
  const { optionCss } = useFieldStatsTrigger();

  const options: EuiComboBoxOptionOption[] = [
    ...createDocCountFieldOption(jobCreator.aggregationFields.length > 0),
    ...createFieldOptions(fields, jobCreator.additionalFields),
  ].map((o) => ({ ...o, css: optionCss }));

  const selection: EuiComboBoxOptionOption[] = [];
  if (selectedField !== null) {
    selection.push({ label: selectedField });
  }

  function onChange(selectedOptions: EuiComboBoxOptionOption[]) {
    const option = selectedOptions[0];
    if (typeof option !== 'undefined') {
      changeHandler(option.label);
    } else {
      changeHandler(null);
    }
  }

  return (
    <OptionListWithFieldStats
      singleSelection={{ asPlainText: true }}
      options={options}
      selectedOptions={selection}
      onChange={onChange}
      isClearable={true}
      data-test-subj="mlSummaryCountFieldNameSelect"
      titleId={titleId}
    />
  );
};
