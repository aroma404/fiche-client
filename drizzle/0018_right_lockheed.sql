CREATE TABLE `client_reference_counters` (
	`accountId` int NOT NULL,
	`nextReference` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_reference_counters_accountId` PRIMARY KEY(`accountId`)
);
