import { Scraper } from "./scraper";

const main = async () => {
  const scraper = new Scraper();
  await scraper.scrape();
};

main();
