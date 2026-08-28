CREATE TABLE `client_transaction_counters` (
	`clientId` int NOT NULL,
	`nextReference` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_transaction_counters_clientId` PRIMARY KEY(`clientId`)
);
