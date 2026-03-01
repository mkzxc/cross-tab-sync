import type { SWToTabMessage } from "./sw-types";

const readyTabs = new Set<string>();

//Clean up if a tab closes
async function updateReadyTabs(sw: ServiceWorkerGlobalScope) {
  const allClients = await sw.clients.matchAll({ type: "window" });
  const aliveIds = new Set(allClients.map((c) => c.id));
  for (const id of readyTabs) {
    if (!aliveIds.has(id)) {
      readyTabs.delete(id);
    }
  }
}

function addTab(id: string) {
  readyTabs.add(id);
}

async function getReadyTab(sw: ServiceWorkerGlobalScope) {
  await updateReadyTabs(sw);
  const allClients = await sw.clients.matchAll({ type: "window" });

  if (allClients.length === 0) throw new Error("There are no open tabs");

  const readyClients = allClients.filter((c) => readyTabs.has(c.id));
  if (readyClients.length > 0) return readyClients[0];

  return new Promise<WindowClient>((resolve, reject) => {
    const interval = setInterval(async () => {
      const clients = await sw.clients.matchAll({ type: "window" });

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

async function notifyAllTabs(
  sw: ServiceWorkerGlobalScope,
  data: Omit<SWToTabMessage, "type">,
) {
  const allClients = await sw.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  allClients.forEach((client) =>
    client.postMessage({ ...data, type: "DB_UPDATED" }),
  );
}

export { addTab, getReadyTab, notifyAllTabs };
