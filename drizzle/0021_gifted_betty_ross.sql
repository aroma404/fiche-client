ALTER TABLE `cabinet_finance_entries` ADD `clientTransactionReference` int;--> statement-breakpoint
ALTER TABLE `client_documents` ADD `paymentDone` boolean DEFAULT false NOT NULL;