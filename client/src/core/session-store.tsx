/** Atelier fiscal moderne — état de session uniquement, volontairement sans localStorage ni API. */

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { createInitialFicheState, type CashEntry, type ComplianceItem, type DocumentItem, type FicheState, type Payment, type WorkCase } from "@/types/fiche";
import { uid } from "@/lib/format";

type SessionAction =
  | { type: "FIELD"; scope: "general" | "fiscal"; field: string; value: string }
  | { type: "DOCUMENT"; id: string; patch: Partial<DocumentItem> }
  | { type: "COMPLIANCE"; id: string; patch: Partial<ComplianceItem> }
  | { type: "CASE"; id: string; patch: Partial<WorkCase> }
  | { type: "CASE_ADD" }
  | { type: "PAYMENT"; id: string; patch: Partial<Payment> }
  | { type: "PAYMENT_ADD" }
  | { type: "PAYMENT_DELETE"; id: string }
  | { type: "CASH"; id: string; patch: Partial<CashEntry> }
  | { type: "CASH_ADD"; entryType: CashEntry["type"] }
  | { type: "CASH_DELETE"; id: string }
  | { type: "SOLDE_INITIAL"; value: number }
  | { type: "OBSERVATIONS"; value: string }
  | { type: "RESET" };

const updateById = <T extends { id: string }>(items: T[], id: string, patch: Partial<T>) =>
  items.map((item) => (item.id === id ? { ...item, ...patch } : item));

function reducer(state: FicheState, action: SessionAction): FicheState {
  switch (action.type) {
    case "FIELD":
      return { ...state, [action.scope]: { ...state[action.scope], [action.field]: action.value } };
    case "DOCUMENT":
      return { ...state, documents: updateById(state.documents, action.id, action.patch) };
    case "COMPLIANCE":
      return { ...state, compliance: updateById(state.compliance, action.id, action.patch) };
    case "CASE":
      return { ...state, cases: updateById(state.cases, action.id, action.patch) };
    case "CASE_ADD":
      return { ...state, cases: [...state.cases, { id: uid("dossier"), label: "Nouveau dossier", type: "Autre", status: "À préparer", note: "" }] };
    case "PAYMENT":
      return { ...state, payments: updateById(state.payments, action.id, action.patch) };
    case "PAYMENT_ADD":
      return { ...state, payments: [...state.payments, { id: uid("paiement"), date: "", objet: "", reference: "", montant: 0 }] };
    case "PAYMENT_DELETE":
      return { ...state, payments: state.payments.filter((item) => item.id !== action.id) };
    case "CASH":
      return { ...state, cashEntries: updateById(state.cashEntries, action.id, action.patch) };
    case "CASH_ADD":
      return { ...state, cashEntries: [...state.cashEntries, { id: uid("caisse"), date: "", libelle: "", type: action.entryType, montant: 0 }] };
    case "CASH_DELETE":
      return { ...state, cashEntries: state.cashEntries.filter((item) => item.id !== action.id) };
    case "SOLDE_INITIAL":
      return { ...state, soldeInitial: action.value };
    case "OBSERVATIONS":
      return { ...state, observations: action.value };
    case "RESET":
      return createInitialFicheState();
  }
}

interface SessionContextValue {
  state: FicheState;
  dispatch: React.Dispatch<SessionAction>;
  reset: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialFicheState);
  const value = useMemo(() => ({ state, dispatch, reset: () => dispatch({ type: "RESET" }) }), [state]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession doit être utilisé dans SessionProvider");
  return context;
}
