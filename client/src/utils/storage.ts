export type StoredConfig = {
  apiKey: string;
  version: number;
};

const API_KEY_STORAGE = "gemini_api_key";

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? "";
  } catch (error) {
    return "";
  }
}

export function setStoredApiKey(apiKey: string): void {
  try {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE, apiKey);
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  } catch (error) {
    return;
  }
}

export function exportConfig(apiKey: string): string {
  const payload: StoredConfig = {
    apiKey,
    version: 1,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseConfig(text: string): StoredConfig | null {
  try {
    const parsed = JSON.parse(text) as Partial<StoredConfig>;
    if (typeof parsed.apiKey === "string" && typeof parsed.version === "number") {
      return { apiKey: parsed.apiKey, version: parsed.version };
    }
  } catch (error) {
    return null;
  }
  return null;
}
