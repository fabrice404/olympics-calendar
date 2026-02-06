import { removeSync } from "fs-extra/esm";
import nodeCron from "node-cron";

import { Scraper } from "./scraper";

const main = () => {
  nodeCron.schedule("*/10 * * * *", async () => {
    try {
      removeSync("./cache/schedules");
      const scraper = new Scraper();
      await scraper.scrape();
    } catch (error) {
      console.error("Error during scheduled scrape:", error);
    }
  });

  nodeCron.schedule("0 0 * * *", () => {
    removeSync("./cache/disciplinesevents");
    removeSync("./cache/nocs");
  });

  const scraper = new Scraper();
  scraper.scrape().catch((error) => {
    console.error("Error during initial scrape:", error);
  });
};

main();
