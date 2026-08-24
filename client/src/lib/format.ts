/** Atelier fiscal moderne — calculs purs et formatage français, sans persistance. */

import type { CashEntry, Payment } from "@/types/fiche";

export const formatDA = (value: number) =>
  new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 2 }).format(value || 0);

export const paymentTotal = (payments: Payment[]) => payments.reduce((total, item) => total + Number(item.montant || 0), 0);

export const cashTotal = (entries: CashEntry[], type: CashEntry["type"]) =>
  entries.filter((entry) => entry.type === type).reduce((total, entry) => total + Number(entry.montant || 0), 0);

export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
