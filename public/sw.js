// src/sw/sw-tabs-manager.ts
var readyTabs = /* @__PURE__ */ new Set();
async function updateReadyTabs(sw2) {
  const allClients = await sw2.clients.matchAll({ type: "window" });
  const aliveIds = new Set(allClients.map((c) => c.id));
  for (const id of readyTabs) {
    if (!aliveIds.has(id)) {
      readyTabs.delete(id);
    }
  }
}
function addTab(id) {
  readyTabs.add(id);
}
async function getReadyTab(sw2) {
  await updateReadyTabs(sw2);
  const allClients = await sw2.clients.matchAll({ type: "window" });
  if (allClients.length === 0) throw new Error("There are no open tabs");
  const readyClients = allClients.filter((c) => readyTabs.has(c.id));
  if (readyClients.length > 0) return readyClients[0];
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const clients = await sw2.clients.matchAll({ type: "window" });
      if (clients.length === 0) {
        clearInterval(interval);
        reject(new Error("There are no open tabs"));
        return;
      }
      const ready = clients.filter((c) => readyTabs.has(c.id));
      if (ready.length > 0) {
        clearInterval(interval);
        resolve(ready[0]);
      }
    }, 100);
  });
}
async function notifyAllTabs(sw2, data) {
  const allClients = await sw2.clients.matchAll({
    includeUncontrolled: true,
    type: "window"
  });
  allClients.forEach(
    (client) => client.postMessage({ ...data, type: "DB_UPDATED" })
  );
}

// src/sw/sw-dw-manager.ts
var workerPort = null;
var workerOwnerClientId = null;
var workerReadyPromise = null;
var workerReadyResolve = null;
var workerRecoveryPromise = null;
function getWorkerPort() {
  return workerPort;
}
function resetWorkerPort() {
  workerPort = null;
  workerOwnerClientId = null;
}
function setWorkerPort(port, clientId) {
  workerPort = port;
  workerOwnerClientId = clientId;
  if (workerReadyResolve) {
    workerReadyResolve();
    workerReadyPromise = null;
    workerReadyResolve = null;
  }
}
async function handleWorkerRecoveryPromise(sw2) {
  try {
    resetWorkerPort();
    const client = await getReadyTab(sw2);
    workerReadyPromise = new Promise((resolve) => {
      workerReadyResolve = resolve;
    });
    client.postMessage({
      type: !workerPort ? "CREATE_WORKER" : "RESEND_PORT"
    });
    await workerReadyPromise;
  } finally {
    workerRecoveryPromise = null;
  }
}
async function ensurePortIsReady(sw2) {
  if (workerRecoveryPromise) {
    await workerRecoveryPromise;
    return;
  }
  if (workerPort && workerOwnerClientId) {
    const allClients = await sw2.clients.matchAll({ type: "window" });
    const ownerAlive = allClients.some((c) => c.id === workerOwnerClientId);
    if (ownerAlive) return;
  }
  workerRecoveryPromise = handleWorkerRecoveryPromise(sw2);
  await workerRecoveryPromise;
}

// src/sw/sw-db-manager.ts
async function sendToWorker(message) {
  return new Promise((resolve, reject) => {
    const workerPort2 = getWorkerPort();
    if (!workerPort2) return reject(new Error("No worker port"));
    const timeout = setTimeout(
      () => reject(new Error("Worker response timed out")),
      5e3
    );
    workerPort2.onmessage = (e) => {
      clearTimeout(timeout);
      switch (e.data.type) {
        case "SUCCESS":
          resolve(e.data);
          return;
        case "FAILURE":
          reject(new Error(e.data.error));
          return;
        default:
          reject(new Error(`Unexpected Message Event Data: ${e.data}`));
      }
    };
    workerPort2.postMessage(message);
  });
}
async function handleExec(event, sw2) {
  const body = await event.request.json();
  try {
    await ensurePortIsReady(sw2);
    return await navigator.locks.request("db-lock", async () => {
      const result = await sendToWorker({ type: "EXEC", ...body });
      await notifyAllTabs(sw2, { sql: body.sql });
      return new Response(JSON.stringify(result));
    });
  } catch (err) {
    const error = err;
    console.error("SW exec error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
async function handleQuery(event, sw2) {
  const body = await event.request.json();
  try {
    await ensurePortIsReady(sw2);
    const result = await sendToWorker({ type: "QUERY", ...body });
    return new Response(JSON.stringify(result));
  } catch (err) {
    const error = err;
    console.error("SW query error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}

// src/sw/sw.ts
var sw = self;
sw.addEventListener("install", () => {
  sw.skipWaiting();
});
sw.addEventListener("activate", (event) => {
  event.waitUntil(sw.clients.claim());
});
async function isPortAlive() {
  const workerPort2 = getWorkerPort();
  if (!workerPort2) return false;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resetWorkerPort();
      resolve(false);
    }, 300);
    workerPort2.onmessage = (e) => {
      if (e.data.type === "PONG") {
        clearTimeout(timeout);
        resolve(true);
      }
    };
    workerPort2.postMessage({ type: "PING" });
  });
}
sw.addEventListener("message", async (event) => {
  const data = event.data;
  if (data.type === "TAB_READY") {
    const source = event.source;
    addTab(source.id);
  }
  if (data.type === "HAS_WORKER") {
    const alive = await isPortAlive();
    event.ports[0].postMessage({ hasWorker: alive });
  }
  if (data.type === "WORKER_PORT") {
    const source = event.source;
    setWorkerPort(data.port, source.id);
    source.postMessage({ type: "PORT_READY" });
  }
});
sw.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("/__db__/exec")) {
    event.respondWith(handleExec(event, sw));
  } else if (url.includes("/__db__/query")) {
    event.respondWith(handleQuery(event, sw));
  }
});
