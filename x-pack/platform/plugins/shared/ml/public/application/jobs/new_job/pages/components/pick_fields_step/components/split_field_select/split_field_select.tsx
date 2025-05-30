/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC } from 'react';
import React from 'react';
import type { EuiComboBoxOptionOption } from '@elastic/eui';

import type { Field, SplitField } from '@kbn/ml-anomaly-utils';
import type { DropDownLabel } from '@kbn/ml-field-stats-flyout';
import { OptionListWithFieldStats, useFieldStatsTrigger } from '@kbn/ml-field-stats-flyout';

interface Props {
  fields: Field[];
  changeHandler(f: SplitField): void;
  selectedField: SplitField;
  isClearable: boolean;
  testSubject?: string;
  placeholder?: string;
  titleId: string;
}

export const SplitFieldSelect: FC<Props> = ({
  fields,
  changeHandler,
  selectedField,
  isClearable,
  testSubject,
  placeholder,
  titleId,
}) => {
  const { optionCss } = useFieldStatsTrigger();
  const options: DropDownLabel[] = fields.map(
    (f) =>
      ({
        label: f.name,
        field: f,
        css: optionCss,
      } as DropDownLabel)
  );

  const selection: DropDownLabel[] = [];
  if (selectedField !== null) {
    selection.push({ label: selectedField.name, field: selectedField } as DropDownLabel);
  }

  function onChange(selectedOptions: EuiComboBoxOptionOption[]) {
    const option = selectedOptions[0] as DropDownLabel;
    if (typeof option?.field !== 'undefined') {
      changeHandler(option.field);
    } else {
      changeHandler(null);
    }
  }

  return (
    <OptionListWithFieldStats
      singleSelection={true}
      options={options}
      selectedOptions={selection}
      onChange={onChange}
      isClearable={isClearable}
      placeholder={placeholder}
      data-test-subj={testSubject}
      titleId={titleId}
    />
  );
};
