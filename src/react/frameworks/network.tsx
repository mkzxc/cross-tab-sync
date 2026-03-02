import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC } from "react";

const queryClient = new QueryClient();

const NetworkProvider: FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { NetworkProvider };
