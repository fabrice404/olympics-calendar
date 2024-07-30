import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export const saveFile = (path: string, content: string): void => {
  const folder = path.split("/").slice(0, -1).join("/");
  mkdirSync(folder, { recursive: true });
  writeFileSync(path, content);
};

export const hasFile = (path: string) => existsSync(path);

export const readFile = (path: string) => readFileSync(path, "utf-8");
