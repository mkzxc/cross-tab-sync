/// <reference lib="webworker" />

import { getReadyTab } from "./sw-tabs-manager.js";

let workerPort: MessagePort | null = null;
let workerOwnerClientId: string | null = null; //Client = Tab
let workerReadyPromise: Promise<void> | null = null; //Track worker setup
let workerReadyResolve: (() => void) | null = null;
let workerRecoveryPromise: Promise<void> | null = null;

function getWorkerPort() {
  return workerPort;
}

function resetWorkerPort() {
  workerPort = null;
  workerOwnerClientId = null;
}

function setWorkerPort(port: MessagePort, clientId: string) {
  workerPort = port;
  workerOwnerClientId = clientId;
  if (workerReadyResolve) {
    workerReadyResolve();
    workerReadyPromise = null;
    workerReadyResolve = null;
  }
}

async function handleWorkerRecoveryPromise(sw: ServiceWorkerGlobalScope) {
  try {
    resetWorkerPort();

    const client = await getReadyTab(sw);

    workerReadyPromise = new Promise((resolve) => {
      workerReadyResolve = resolve;
    });

    client.postMessage({
      type: !workerPort ? "CREATE_WORKER" : "RESEND_PORT",
    });
    await workerReadyPromise;
  } finally {
    //This has to be cleared otherwise next failures can't trigger recovery again
    workerRecoveryPromise = null;
  }
}

/**
 * In case that the tab owning the dw is closed,
 * we have to make sure that the requests don't call sendToWorker before the port is ready,
 * so all the requests have to wait on same promise
 */
async function ensurePortIsReady(sw: ServiceWorkerGlobalScope) {
  if (workerRecoveryPromise) {
    await workerRecoveryPromise;
    return;
  }

  if (workerPort && workerOwnerClientId) {
    const allClients = await sw.clients.matchAll({ type: "window" });
    const ownerAlive = allClients.some((c) => c.id === workerOwnerClientId);
    if (ownerAlive) return;
  }

  workerRecoveryPromise = handleWorkerRecoveryPromise(sw);
  await workerRecoveryPromise;
}

export { getWorkerPort, resetWorkerPort, setWorkerPort, ensurePortIsReady };
