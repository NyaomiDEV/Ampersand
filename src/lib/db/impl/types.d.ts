import type { UUIDable } from "../entities";
export type IndexEntry<T> = UUIDable & Partial<T>;
export type SecondaryKey<T> = (Exclude<keyof T, keyof UUIDable>);