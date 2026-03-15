type TabToSWMessage =
  | { type: "HAS_WORKER_REQUEST" }
  | { type: "WORKER_PORT"; payload: MessagePort }
  | { type: "TAB_READY" }
  | { type: "RESEND_PORT" }
  | { type: "NO_WORKER_HERE" };

type SWToTabMessage =
  | { type: "PORT_READY" }
  | { type: "CREATE_WORKER" }
  | { type: "RESEND_PORT" }
  | { type: "OP_SUCCESS"; payload: unknown }
  | { type: "HAS_WORKER_RESPONSE"; payload: boolean };

type DWToSWMessage =
  | { type: "PONG" }
  | { type: "SUCCESS"; result: unknown }
  | { type: "FAILURE"; error: string };

type SWToDWMessage = { type: "PING" } | { type: "OP"; payload: unknown };

type TabToDWMessage = { type: "SW_PORT"; payload: MessagePort };

export type {
  TabToSWMessage,
  SWToTabMessage,
  DWToSWMessage,
  SWToDWMessage,
  TabToDWMessage,
};
