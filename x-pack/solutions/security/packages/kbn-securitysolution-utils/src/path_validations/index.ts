/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const WILDCARD_WARNING = i18n.translate('utils.wildcardWarning', {
  defaultMessage: `Using wildcards can impact Endpoint performance`,
});

export const FILEPATH_WARNING = i18n.translate('utils.filename.pathWarning', {
  defaultMessage: `Path may be formed incorrectly; verify value`,
});

export enum ConditionEntryField {
  HASH = 'process.hash.*',
  PATH = 'process.executable.caseless',
  SIGNER = 'process.Ext.code_signature',
  SIGNER_MAC = 'process.code_signature',
}

export enum EntryFieldType {
  HASH = '.hash.',
  EXECUTABLE = '.executable.caseless',
  PATH = '.path',
  SIGNER = '.code_signature',
}

export type TrustedAppConditionEntryField =
  | 'process.hash.*'
  | 'process.executable.caseless'
  | 'process.Ext.code_signature'
  | 'process.code_signature';

export type BlocklistConditionEntryField =
  | 'file.hash.*'
  | 'file.path'
  | 'file.Ext.code_signature'
  | 'file.path.caseless';
export type AllConditionEntryFields =
  | TrustedAppConditionEntryField
  | BlocklistConditionEntryField
  | 'file.path.text';

export enum OperatingSystem {
  LINUX = 'linux',
  MAC = 'macos',
  WINDOWS = 'windows',
}

export type EntryTypes = 'match' | 'wildcard' | 'match_any';
export type TrustedAppEntryTypes = Extract<EntryTypes, 'match' | 'wildcard'>;
export type EventFiltersTypes = EntryTypes | 'exists' | 'nested';

export const validatePotentialWildcardInput = ({
  field = '',
  os,
  value = '',
}: {
  field?: string;
  os: OperatingSystem;
  value?: string;
}): string | undefined => {
  const textInput = value.trim();
  if (field === 'file.path.text') {
    return validateFilePathInput({ os, value: textInput });
  }
  return validateWildcardInput(textInput);
};

export const validateFilePathInput = ({
  os,
  value,
}: {
  os: OperatingSystem;
  value: string;
}): string | undefined => {
  const isValidFilePath = isPathValid({
    os,
    field: 'file.path.text',
    type: 'wildcard',
    value,
  });
  const hasSimpleFileName = hasSimpleExecutableName({
    os,
    type: 'wildcard',
    value,
  });

  if (!value.length) {
    return FILEPATH_WARNING;
  }

  if (isValidFilePath) {
    if (hasSimpleFileName !== undefined && !hasSimpleFileName) {
      return WILDCARD_WARNING;
    }
  } else {
    return FILEPATH_WARNING;
  }
};

export const validateWildcardInput = (value: string | string[]): string | undefined => {
  const wildcardRegex = /[*?]/;
  if (Array.isArray(value)) {
    const doesAnyValueContainWildcardInput = value.some((v) => wildcardRegex.test(v));
    if (doesAnyValueContainWildcardInput) {
      return WILDCARD_WARNING;
    }
  } else {
    if (wildcardRegex.test(value)) {
      return WILDCARD_WARNING;
    }
  }
};

export const validateHasWildcardWithWrongOperator = ({
  operator,
  value,
}: {
  operator: TrustedAppEntryTypes | EventFiltersTypes;
  value: string | string[];
}): boolean => {
  if (operator !== 'wildcard' && validateWildcardInput(value)) {
    return true;
  } else {
    return false;
  }
};

export const hasSimpleExecutableName = ({
  os,
  type,
  value,
}: {
  os: OperatingSystem;
  type: EntryTypes;
  value: string;
}): boolean | undefined => {
  const separator = os === OperatingSystem.WINDOWS ? '\\' : '/';
  const lastString = value.split(separator).pop();
  if (!lastString) {
    return;
  }
  if (type === 'wildcard') {
    return (lastString.split('*').length || lastString.split('?').length) === 1;
  }
  return true;
};

export const isPathValid = ({
  os,
  field,
  type,
  value,
}: {
  os: OperatingSystem;
  field: AllConditionEntryFields;
  type: EntryTypes;
  value: string;
}): boolean => {
  const pathFields: AllConditionEntryFields[] = [
    'process.executable.caseless',
    'file.path',
    'file.path.text',
  ];
  if (pathFields.includes(field)) {
    if (type === 'wildcard') {
      return os === OperatingSystem.WINDOWS
        ? isWindowsWildcardPathValid(value)
        : isLinuxMacWildcardPathValid(value);
    }
    return doesPathMatchRegex({ value, os });
  }
  return true;
};

const doesPathMatchRegex = ({ os, value }: { os: OperatingSystem; value: string }): boolean => {
  if (os === OperatingSystem.WINDOWS) {
    const filePathRegex =
      /^[a-z]:(?:|\\\\[^<>:"'/\\|?*]+\\[^<>:"'/\\|?*]+|%\w+%|)[\\](?:[^<>:"'/\\|?*]+[\\/])*([^<>:"'/\\|?*])+$/i;
    return filePathRegex.test(value);
  }
  return /^(\/|(\/[\w\-]+)+|\/[\w\-]+\.[\w]+|(\/[\w-]+)+\/[\w\-]+\.[\w]+)$/i.test(value);
};

const isWindowsWildcardPathValid = (path: string): boolean => {
  const firstCharacter = path[0];
  const lastCharacter = path.slice(-1);
  const trimmedValue = path.trim();
  const hasSlash = /\//.test(trimmedValue);
  if (path.length === 0) {
    return false;
  } else if (
    hasSlash ||
    trimmedValue.length !== path.length ||
    firstCharacter === '^' ||
    lastCharacter === '\\' ||
    !hasWildcardInPath({ path, isWindowsPath: true })
  ) {
    return false;
  } else {
    return true;
  }
};

const isLinuxMacWildcardPathValid = (path: string): boolean => {
  const firstCharacter = path[0];
  const lastCharacter = path.slice(-1);
  const trimmedValue = path.trim();
  if (path.length === 0) {
    return false;
  } else if (
    trimmedValue.length !== path.length ||
    firstCharacter !== '/' ||
    lastCharacter === '/' ||
    path.length > 1024 === true ||
    path.includes('//') === true ||
    !hasWildcardInPath({ path, isWindowsPath: false })
  ) {
    return false;
  } else {
    return true;
  }
};

const hasWildcardInPath = ({
  path,
  isWindowsPath,
}: {
  path: string;
  isWindowsPath: boolean;
}): boolean => {
  for (const pathComponent of path.split(isWindowsPath ? '\\' : '/')) {
    if (/[\*|\?]+/.test(pathComponent) === true) {
      return true;
    }
  }
  return false;
};
