// TS is not able to infer the type when using unknown since we do not constrain the type elsewhere
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionData = Record<string, (payload: any) => unknown>;

export type { ActionData };
