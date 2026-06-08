import { TransactionStatus, TransactionStatusSuccess, TransactionStatusSuccessWithoutDetails } from "./types";

export function transactionSucceeded(status: TransactionStatus): status is TransactionStatusSuccess | TransactionStatusSuccessWithoutDetails {
	return status.success;
}

export function transactionHasDetails(status: TransactionStatusSuccess | TransactionStatusSuccessWithoutDetails): status is TransactionStatusSuccess {
	return !!(status as TransactionStatusSuccess).detail;
}