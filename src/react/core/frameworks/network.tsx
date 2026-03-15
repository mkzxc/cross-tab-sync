import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { FC } from "react";
// import { getQueryClient } from "../../../sw/sw-query-client";

//TEST FOR DEMO
const queryClient = new QueryClient();
// const queryClient = getQueryClient();

const NetworkProvider: FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { NetworkProvider, queryClient };
