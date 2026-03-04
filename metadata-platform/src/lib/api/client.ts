type ApiResponse<T> = {
  data: T
  pagination?: { page: number; size: number; total: number }
}

type ApiError = {
  error: { code: string; message: string }
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!response.ok) {
    const error: ApiError = await response.json()
    throw new Error(error.error.message)
  }

  return response.json()
}
