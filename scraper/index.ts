import { removeSync } from "fs-extra/esm";
import nodeCron from "node-cron";

import { Scraper } from "./scraper";

const main = () => {
  nodeCron.schedule("*/10 * * * *", () => {
    removeSync("./cache/schedules");
    const scraper = new Scraper();
    scraper.scrape();
  });

  nodeCron.schedule("0 0 * * *", () => {
    removeSync("./cache/disciplinesevents");
    removeSync("./cache/nocs");
  });

  const scraper = new Scraper();
  scraper.scrape();
};

main();
