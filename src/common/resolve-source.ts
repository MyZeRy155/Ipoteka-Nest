export interface CompareReport<T> {
  moreActual: string | null;
  sources: {
    source: string;
    available: boolean;
    data: T | null;
  }[];
}

export const Sources = {
  exchangeRateAPI: 'Exchange_API',
  cbRF: 'Parser-CBRF',
} as const;

export interface ResolveSource<T> {
  source: string;
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: unknown;
}

export function resolveSource<T>(
  source: string,
  settled: PromiseSettledResult<T>,
): ResolveSource<T> {
  if (settled.status === 'fulfilled') {
    return { source: source, status: 'fulfilled', value: settled.value };
  } else {
    return { source: source, status: 'rejected', reason: settled.reason };
  }
}

export function compareSources<T extends { sourceUpdatedAt: Date }>(
  x: ResolveSource<T>,
  y: ResolveSource<T>,
): CompareReport<T> {
  const xAvailable = x.status === 'fulfilled';
  const yAvailable = y.status === 'fulfilled';

  let moreActual: string | null = null;
  if (xAvailable && yAvailable) {
    moreActual =
      x.value!.sourceUpdatedAt >= y.value!.sourceUpdatedAt
        ? x.source
        : y.source;
  }

  return {
    moreActual,
    sources: [
      { source: x.source, available: xAvailable, data: x.value ?? null },
      { source: y.source, available: yAvailable, data: y.value ?? null },
    ],
  };
}
