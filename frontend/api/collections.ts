import { Collection } from "@/lib/types";
import { Api } from "@/lib/apiClient";

const mapCollection = (c: unknown) => c as Collection;

export async function listCollections(token?: string, lang?: string): Promise<Collection[]> {
  const { payload } = await Api.listCollections({ token, lang });
  return (payload.collections || []).map(mapCollection);
}

export async function createCollection(name: string, token?: string, lang?: string): Promise<Collection> {
  const { payload } = await Api.createCollection(name, { token, lang });
  return payload.collection as Collection;
}

export async function deleteCollection(id: number, token?: string, lang?: string): Promise<void> {
  await Api.deleteCollection(id, { token, lang });
}
