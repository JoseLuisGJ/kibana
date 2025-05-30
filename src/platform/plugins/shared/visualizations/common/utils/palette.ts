/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ColorSchemas, getHeatmapColors } from '@kbn/charts-plugin/common';
import { Range } from '@kbn/expressions-plugin/common';

export interface PaletteConfig {
  color: Array<string | undefined>;
  stop: number[];
}

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const getColor = (
  index: number,
  elementsCount: number,
  colorSchema: ColorSchemas,
  invertColors: boolean = false
) => {
  const divider = Math.max(elementsCount - 1, 1);
  const value = invertColors ? 1 - index / divider : index / divider;
  return getHeatmapColors(value, colorSchema);
};

export const getStopsWithColorsFromRanges = (
  ranges: Range[],
  colorSchema: ColorSchemas,
  invertColors: boolean = false
) => {
  return ranges.reduce<PaletteConfig>(
    (acc, range, index, rangesArr) => {
      if ((index && range.from !== rangesArr[index - 1].to) || index === 0) {
        acc.color.push(TRANSPARENT);
        acc.stop.push(range.from);
      }

      acc.color.push(getColor(index, rangesArr.length, colorSchema, invertColors));
      acc.stop.push(range.to);

      return acc;
    },
    { color: [], stop: [] }
  );
};
