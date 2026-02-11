const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const fieldErrors =
      typeof errorBody?.details?.fieldErrors === "object" && errorBody.details.fieldErrors !== null
        ? (errorBody.details.fieldErrors as Record<string, unknown>)
        : {};
    const formErrors = Array.isArray(errorBody?.details?.formErrors) ? errorBody.details.formErrors : [];
    const firstFieldErrorGroup = Object.values(fieldErrors).find((v) => Array.isArray(v) && v.length > 0);
    const firstFieldError = Array.isArray(firstFieldErrorGroup) ? firstFieldErrorGroup[0] : null;
    const detailMessage =
      typeof firstFieldError === "string" && firstFieldError.length > 0
        ? firstFieldError
        : typeof formErrors[0] === "string" && formErrors[0].length > 0
          ? formErrors[0]
          : null;
    const errorMessage =
      detailMessage ?? (typeof errorBody?.error === "string" ? errorBody.error : `request_failed_${response.status}`);
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
