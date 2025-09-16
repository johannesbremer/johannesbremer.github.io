import { del, get, set } from "idb-keyval";

const API_KEY_STORAGE_KEY = "openai-api-key";

export async function deleteApiKey(): Promise<void> {
  try {
    await del(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to delete API key:", error);
    throw new Error("Failed to delete API key");
  }
}

export async function getApiKey(): Promise<null | string> {
  try {
    return (await get(API_KEY_STORAGE_KEY)) || null;
  } catch (error) {
    console.error("Failed to get API key:", error);
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  try {
    await set(API_KEY_STORAGE_KEY, key);
  } catch (error) {
    console.error("Failed to set API key:", error);
    throw new Error("Failed to save API key");
  }
}
