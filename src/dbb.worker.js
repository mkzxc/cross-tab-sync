import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

console.trace("[DW] worker script started");

let db;
let port;

async function initDB() {
  const sqlite3 = await sqlite3InitModule({
    print: console.log,
    printErr: console.error,
    locateFile: (file) => `/node_modules/@sqlite.org/sqlite-wasm/dist/${file}`,
  });

  if ("opfs" in sqlite3) {
    const poolUtil = await sqlite3.installOpfsSAHPoolVfs({});
    db = new poolUtil.OpfsSAHPoolDb("/myapp.sqlite3");
  } else {
    console.error("OPFS not available");
    db = new sqlite3.oo1.DB(":memory:");
  }

  // Create table on first run
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  console.log("DW: Initialized DB");
}

async function handleMessage(port, data) {
  try {
    if (data.type === "EXEC") {
      db.exec("BEGIN TRANSACTION");
      try {
        db.exec({ sql: data.sql, bind: data.bind ?? [] });
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
      port.postMessage({ success: true });
    } else if (data.type === "QUERY") {
      const rows = [];
      db.exec({
        sql: data.sql,
        bind: data.bind ?? [],
        rowMode: "object",
        callback: (row) => rows.push(row),
      });
      port.postMessage({ success: true, rows });
    }
  } catch (err) {
    port.postMessage({ success: false, error: err.message });
  }
}

initDB().then(() => {
  self.postMessage({ type: "READY" });
  self.addEventListener("message", (event) => {
    if (event.data.type === "SW_PORT") {
      port = event.data.port;
      port.onmessage = (e) => {
        if (e.data.type === "PING") {
          port.postMessage({ type: "PONG" });
          return;
        }
        handleMessage(port, e.data);
      };
    }
  });
});
