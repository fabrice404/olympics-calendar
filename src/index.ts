import { Calendar } from "./calendar";

const main = async () => {
  // for (const language of ["en", "ja", "ko", "ru", "zh"]) {
  for (const language of ["en"]) {
    const cal = new Calendar(language)
    await cal.generate();
  }
};

main();
