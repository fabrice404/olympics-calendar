import Debug from "debug";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export class Cache {
  private debug = Debug("olympics-calendar:cache");

  private cachePath = (key: string): string => {
    return `./cache/${key}.json`;
  };

  public get(key: string): string | null {
    this.debug("get", key);
    const path = this.cachePath(key);
    if (existsSync(path)) {
      return readFileSync(path, "utf-8");
    }
    return null;
  }

  public has(key: string): boolean {
    this.debug(`has: key=${key}`);
    const path = this.cachePath(key);
    return existsSync(path);
  }

  public set(key: string, data: string): void {
    this.debug(`set: key=${key}`);
    const path = this.cachePath(key);
    mkdirSync(path.split("/").slice(0, -1).join("/"), { recursive: true });
    writeFileSync(path, data);
  }
}
