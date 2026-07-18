export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "viewer";
  createdAt: string;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  createdAt: string;
}

export interface Widget {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
}

export interface APIResponse<T> {
  data: T;
  error?: string;
}
