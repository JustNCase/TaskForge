import { describe, it, expect } from "vitest";
import { findAll, findById, insert, update, remove, count, findPaginated, upsert } from "../crud";

function mockClient(data: any = null, countNum?: number) {
  const result = { data, error: null, count: countNum ?? (Array.isArray(data) ? data.length : 0) };

  const chain: any = {
    select: chainFn(),
    eq: chainFn(),
    order: chainFn(),
    range: chainFn(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] ?? null : data, error: null }),
    insert: chainFn(),
    update: chainFn(),
    delete: chainFn(),
    upsert: chainFn(),
  };

  chain.then = (resolve: any, reject?: any) => Promise.resolve(result).then(resolve, reject);

  const client = { from: vi.fn(() => chain) };
  return { client: client as any, chain };
}

function chainFn() {
  return vi.fn().mockImplementation(function (this: any) { return this; });
}

import { vi } from "vitest";

describe("CRUD operations", () => {
  it("findAll with filters returns matching records", async () => {
    const records = [{ id: "1", name: "A" }, { id: "2", name: "B" }];
    const { client } = mockClient(records);
    const result = await findAll(client, "tasks", { filters: { status: "active" } });
    expect(result).toEqual(records);
    expect(client.from).toHaveBeenCalledWith("tasks");
  });

  it("findById returns null for missing record", async () => {
    const { client, chain } = mockClient(null);
    chain.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
    const result = await findById(client, "tasks", "nonexistent");
    expect(result).toBeNull();
  });

  it("insert returns created record", async () => {
    const created = { id: "new-1", name: "New Task" };
    const { client } = mockClient(created);
    const result = await insert(client, "tasks", { name: "New Task" });
    expect(result).toEqual(created);
    expect(client.from).toHaveBeenCalledWith("tasks");
  });

  it("update modifies and returns record", async () => {
    const updated = { id: "1", name: "Updated" };
    const { client } = mockClient(updated);
    const result = await update(client, "tasks", "1", { name: "Updated" });
    expect(result).toEqual(updated);
  });

  it("remove returns true on success", async () => {
    const { client } = mockClient(null);
    const result = await remove(client, "tasks", "1");
    expect(result).toBe(true);
  });

  it("count returns correct number", async () => {
    const { client, chain } = mockClient(null, 42);
    chain.then = (resolve: any) => Promise.resolve({ data: null, error: null, count: 42 }).then(resolve);
    const result = await count(client, "tasks");
    expect(result).toBe(42);
  });

  it("findPaginated returns proper page result", async () => {
    const data = [{ id: "1" }, { id: "2" }];
    const { client, chain } = mockClient(data, 10);
    chain.then = (resolve: any) => Promise.resolve({ data, error: null, count: 10 }).then(resolve);
    const result = await findPaginated(client, "tasks", 1, 2);
    expect(result.data).toEqual(data);
    expect(result.count).toBe(10);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
  });

  it("upsert on conflict inserts or updates record", async () => {
    const upserted = { id: "1", name: "Upserted" };
    const { client } = mockClient(upserted);
    const result = await upsert(client, "tasks", { id: "1", name: "Upserted" }, "id");
    expect(result).toEqual(upserted);
  });
});
