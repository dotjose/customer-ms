import { SetMetadata } from '@nestjs/common';

export const METRIC_KEY = 'metric';
export const Metric = (name: string) => SetMetadata(METRIC_KEY, name);