import nodeCron from "node-cron";

import { Scraper } from "./scraper";

const main = async () => {
  nodeCron.schedule("* * * * *", async () => {
    const scraper = new Scraper();
    await scraper.scrape();
  });
};

main();
