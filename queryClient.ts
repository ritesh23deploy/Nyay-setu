import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export const apiRequest = {
  async get<T = any>(url: string): Promise<{ data: T }> {
    const res = await fetch(url, {
      method: 'GET',
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    const data = await res.json();
    return { data };
  },
  
  async post<T = any>(url: string, data?: unknown): Promise<{ data: T }> {
    const res = await fetch(url, {
      method: 'POST',
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    const responseData = await res.json();
    return { data: responseData };
  },
  
  async patch<T = any>(url: string, data?: unknown): Promise<{ data: T }> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    const responseData = await res.json();
    return { data: responseData };
  },
  
  async delete<T = any>(url: string): Promise<{ data: T }> {
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    const responseData = await res.json();
    return { data: responseData };
  },
  
  async upload<T = any>(url: string, formData: FormData): Promise<{ data: T }> {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: "include",
    });
    
    await throwIfResNotOk(res);
    const responseData = await res.json();
    return { data: responseData };
  }
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
