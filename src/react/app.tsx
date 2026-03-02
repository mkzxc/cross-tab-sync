import { StrictMode, type FC } from "react";
import { NetworkProvider } from "./frameworks/network";

const App: FC = () => {
  return (
    <StrictMode>
      <NetworkProvider>
        <App />
      </NetworkProvider>
    </StrictMode>
  );
};

export { App };
