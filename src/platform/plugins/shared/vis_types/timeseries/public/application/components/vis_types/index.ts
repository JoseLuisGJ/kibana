/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { lazy } from 'react';
import { XYChartSeriesIdentifier, GeometryValue } from '@elastic/charts';
import { IUiSettingsClient } from '@kbn/core/public';
import { PersistedState } from '@kbn/visualizations-plugin/public';
import type { PaletteRegistry } from '@kbn/coloring';
import type { FieldFormatMap } from '@kbn/data-views-plugin/common';
import { TimeseriesVisParams } from '../../../types';
import type { TimeseriesVisData, PanelData } from '../../../../common/types';
import { FetchedIndexPattern } from '../../../../common/types';

/**
 * Lazy load each visualization type, since the only one is presented on the screen at the same time.
 * Disable typescript errors since the components are not typed yet.
 */

const timeseries = lazy(() => import('./timeseries/vis'));
const metric = lazy(() => import('./metric/vis'));
const topN = lazy(() => import('./top_n/vis'));
const table = lazy(() => import('./table/vis'));
const gauge = lazy(() => import('./gauge/vis'));
const markdown = lazy(() => import('./markdown/vis'));

export const TimeseriesVisTypes: Record<string, React.ComponentType<TimeseriesVisProps>> = {
  timeseries,
  metric,
  top_n: topN,
  table,
  gauge,
  markdown,
};

export interface TimeseriesVisProps {
  model: TimeseriesVisParams;
  onBrush: (gte: string, lte: string, series: PanelData[]) => Promise<void>;
  onFilterClick: (
    series: PanelData[],
    points: Array<[GeometryValue, XYChartSeriesIdentifier]>
  ) => Promise<void>;
  onUiState: (
    field: string,
    value: {
      column: string;
      order: string;
    }
  ) => void;
  uiState: PersistedState;
  visData: TimeseriesVisData;
  getConfig: IUiSettingsClient['get'];
  syncColors: boolean;
  syncTooltips: boolean;
  syncCursor: boolean;
  palettesService: PaletteRegistry;
  indexPattern?: FetchedIndexPattern['indexPattern'];
  /** @deprecated please use indexPattern.fieldFormatMap instead **/
  fieldFormatMap?: FieldFormatMap;
  initialRender: () => void | undefined;
}
