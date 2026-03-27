/**
 * Port for persisting Set<string> data.
 * Web: localStorage, Mobile: AsyncStorage.
 */
export interface SetStorage {
  load(key: string): Promise<Set<string>>;
  save(key: string, data: Set<string>): Promise<void>;
}
