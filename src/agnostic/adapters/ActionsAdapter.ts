import type { Action } from "../entities/action";

// TS is not able to infer the type when using unknown since we do not constrain the type elsewhere
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionData = Record<string, (payload: any) => unknown>;

//https://stackoverflow.com/a/68352232
type ActionsConfig<T extends ActionData> = {
  [K in Extract<keyof T, string>]: Action<
    K,
    Parameters<T[K]>[0],
    ReturnType<T[K]>
  >;
}[Extract<keyof T, string>];

class ActionsAdapter<T extends ActionData> {
  #actions;

  constructor(config: ActionsConfig<T>[]) {
    this.#actions = new Map<
      (typeof config)[number]["key"],
      {
        onSuccess: (typeof config)[number]["onSuccess"];
        onError: (typeof config)[number]["onError"];
      }
    >();
    config.forEach((action) => {
      this.#actions.set(action.key, {
        // fetcher: config.fetcher,
        onSuccess: action.onSuccess,
        onError: action.onError,
      });
    });
  }

  //TODO I don't like this typecasting, but it should be the safest thing to do for what it's used for
  getActions(key: string) {
    return this.#actions.get(key as Extract<keyof T, string>) || null;
  }
}

export { ActionsAdapter };
export type { ActionData };
