export const queryKeys = {
  domains: {
    all: ['domains'] as const,
    list: (params?: Record<string, string>) =>
      [...queryKeys.domains.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.domains.all, 'detail', id] as const,
  },
  standards: {
    all: ['standards'] as const,
    list: (params?: Record<string, string>) =>
      [...queryKeys.standards.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.standards.all, 'detail', id] as const,
  },
  codes: {
    all: ['codes'] as const,
    list: (params?: Record<string, string>) =>
      [...queryKeys.codes.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.codes.all, 'detail', id] as const,
  },
  workflow: {
    all: ['workflow'] as const,
    list: (params?: Record<string, string>) =>
      [...queryKeys.workflow.all, 'list', params] as const,
    detail: (id: string) =>
      [...queryKeys.workflow.all, 'detail', id] as const,
  },
}
