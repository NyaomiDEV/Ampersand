export type UUIDable = {
	uuid: UUID
};

export type UUID = string;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
