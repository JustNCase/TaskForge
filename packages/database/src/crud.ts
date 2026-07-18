import type { SupabaseClient } from "@supabase/supabase-js";

export interface QueryOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  filters?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export async function findAll<T>(
  client: SupabaseClient,
  table: string,
  options?: QueryOptions
): Promise<T[]> {
  let query = client.from(table).select(options?.select || "*");

  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? false,
    });
  }

  if (options?.limit) {
    query = query.range(
      options.offset || 0,
      (options.offset || 0) + options.limit - 1
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as T[];
}

export async function findPaginated<T>(
  client: SupabaseClient,
  table: string,
  page: number,
  pageSize: number,
  options?: Omit<QueryOptions, "limit" | "offset">
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * pageSize;

  let countQuery = client.from(table).select("*", { count: "exact", head: true });
  let dataQuery = client.from(table).select(options?.select || "*");

  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        countQuery = countQuery.eq(key, value);
        dataQuery = dataQuery.eq(key, value);
      }
    }
  }

  if (options?.order) {
    dataQuery = dataQuery.order(options.order.column, {
      ascending: options.order.ascending ?? false,
    });
  }

  dataQuery = dataQuery.range(offset, offset + pageSize - 1);

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) throw countResult.error;
  if (dataResult.error) throw dataResult.error;

  return {
    data: (dataResult.data || []) as T[],
    count: countResult.count || 0,
    page,
    pageSize,
  };
}

export async function findById<T>(
  client: SupabaseClient,
  table: string,
  id: string
): Promise<T | null> {
  const { data, error } = await client
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

export async function insert<T>(
  client: SupabaseClient,
  table: string,
  record: AnyRecord
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function insertMany<T>(
  client: SupabaseClient,
  table: string,
  records: AnyRecord[]
): Promise<T[]> {
  const { data, error } = await client
    .from(table)
    .insert(records)
    .select();

  if (error) throw error;
  return (data || []) as T[];
}

export async function update<T>(
  client: SupabaseClient,
  table: string,
  id: string,
  updates: AnyRecord
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function remove(
  client: SupabaseClient,
  table: string,
  id: string
): Promise<boolean> {
  const { error } = await client
    .from(table)
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

export async function upsert<T>(
  client: SupabaseClient,
  table: string,
  record: AnyRecord,
  onConflict: string
): Promise<T> {
  const { data, error } = await client
    .from(table)
    .upsert(record, { onConflict })
    .select()
    .single();

  if (error) throw error;
  return data as T;
}

export async function count(
  client: SupabaseClient,
  table: string,
  filters?: Record<string, unknown>
): Promise<number> {
  let query = client.from(table).select("*", { count: "exact", head: true });

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    }
  }

  const { count: total, error } = await query;
  if (error) throw error;
  return total || 0;
}
