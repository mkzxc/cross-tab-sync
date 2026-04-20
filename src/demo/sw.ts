import { SW } from "../library/sw/sw";
import { CUSTOM_HEADER } from "./const";

const serviceWorker = new SW(CUSTOM_HEADER);
serviceWorker.initializeSW(
  (sw) => {
    //We don't want to wait for the existing SW to not have any clients
    sw.skipWaiting();
  },
  (sw, event) => {
    event.waitUntil(sw.clients.claim());
  },
);
