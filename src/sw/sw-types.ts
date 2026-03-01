import type { BindingSpec } from "@sqlite.org/sqlite-wasm";

type TabToSWMessage =
  | { type: "HAS_WORKER" }
  | { type: "WORKER_PORT"; port: MessagePort }
  | { type: "TAB_READY" }
  | { type: "RESEND_PORT" }
  | { type: "NO_WORKER_HERE" };

type SWToTabMessage =
  | { type: "PORT_READY" }
  | { type: "CREATE_WORKER" }
  | { type: "RESEND_PORT" }
  | { type: "DB_UPDATED"; sql: string };

type TabToDWMessage = { type: "SW_PORT"; port: MessagePort };

type DWToTabMessage = { type: "READY" };

type DBExecBody = {
  sql: string;
  bind?: BindingSpec;
};

type SWToDWMessage =
  | { type: "PING" }
  | ({ type: "EXEC" } & DBExecBody)
  | ({ type: "QUERY" } & DBExecBody);

type Row = Record<string, unknown>;
type DWToSWMessage =
  | { type: "PONG" }
  | { type: "SUCCESS"; rows?: Row[] }
  | { type: "FAILURE"; error: string };

type HasWorkerResponse = { hasWorker: boolean };

export type {
  TabToSWMessage,
  SWToTabMessage,
  TabToDWMessage,
  DWToTabMessage,
  SWToDWMessage,
  DWToSWMessage,
  HasWorkerResponse,
  DBExecBody,
  Row,
};
