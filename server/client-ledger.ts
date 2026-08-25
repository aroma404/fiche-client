type ImportableBundle = {
  financeEntries: { entryDate: string; category: "Paiement" | "Caisse"; direction: "Entrée" | "Sortie"; label: string; reference: string; amount: number; note: string }[];
  payments: { paymentDate: string; label: string; reference: string; amount: number }[];
  cashEntries: { entryDate: string; label: string; direction: "Entrée" | "Sortie"; amount: number }[];
};

/** Une seule conversion compatibilité ancien format → registre financier du cabinet. */
export function canonicalFinanceEntries(bundle: ImportableBundle) {
  if (bundle.financeEntries.length) return bundle.financeEntries;
  return [
    ...bundle.payments.map(item => ({ entryDate: item.paymentDate, category: "Paiement" as const, direction: "Entrée" as const, label: item.label, reference: item.reference, amount: item.amount, note: "" })),
    ...bundle.cashEntries.map(item => ({ entryDate: item.entryDate, category: "Caisse" as const, direction: item.direction, label: item.label, reference: "", amount: item.amount, note: "" })),
  ];
}
