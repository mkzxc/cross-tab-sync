//TODO
/// <reference lib="webworker" />

import { SW } from "../sw/sw";

const serviceWorker = new SW();
serviceWorker.initializeSW();
