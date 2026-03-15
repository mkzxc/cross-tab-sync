interface ProviderConfig<T = unknown> {
  // fetcher: (...args: unknown[]) => Promise<T>;
  onSuccess: (result: T) => void;
  onError: (error: string) => void;
}

interface Config<T = unknown> extends ProviderConfig<T> {
  key: string;
}

class Provider {
  #configs: Map<string, ProviderConfig>;

  constructor(configs: Set<Config>) {
    this.#configs = new Map<string, ProviderConfig>();
    configs.forEach((config) => {
      this.#configs.set(config.key, {
        // fetcher: config.fetcher,
        onSuccess: config.onSuccess,
        onError: config.onError,
      });
    });
  }

  getConfigs() {
    return this.#configs;
  }

  getConfig(key: string) {
    return this.#configs.get(key) || null;
  }
}

export { Provider };
export type { Config };
