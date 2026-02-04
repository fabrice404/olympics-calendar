import { removeSync } from "fs-extra/esm";
import nodeCron from "node-cron";

import { Scraper } from "./scraper";

const main = () => {
  nodeCron.schedule("*/1 * * * *", () => {
    removeSync("./cache/schedules");
    const scraper = new Scraper();
    scraper.scrape();
  });

  nodeCron.schedule("0 0 * * *", () => {
    removeSync("./cache/disciplinesevents");
    removeSync("./cache/nocs");
  });
};

main();
