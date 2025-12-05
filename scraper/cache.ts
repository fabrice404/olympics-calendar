import Debug from "debug";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"

const debug = Debug(`olympics-calendar:cache`);

const cachePath = (key: string): string => {
  return `../cache/${key}.cached`;
}

export const get = (key: string): string | null => {
  debug(`get: key=${key}`);
  const path = cachePath(key);
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return null;
}

export const has = (key: string): boolean => {
  debug(`has: key=${key}`);
  const path = cachePath(key);
  return existsSync(path);
}

export const set = (key: string, data: string): void => {
  debug(`set: key=${key}`);
  const path = cachePath(key);
  mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
  writeFileSync(path, data);
}
