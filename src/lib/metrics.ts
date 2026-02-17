import 'server-only';

type MetricEvent = {
  source: string;
  event: string;
  [key: string]: unknown;
};

export function trackMetric(event: MetricEvent) {
  // Structured logs are the first step; this can be wired to analytics later.
  console.info('[metric]', JSON.stringify(event));
}
