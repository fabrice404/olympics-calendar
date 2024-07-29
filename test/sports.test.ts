import { describe } from "node:test";
import { expect, it } from "vitest";
import { getSportIcon } from "../src/sports";

describe("sports", () => {
  describe("getSportIcon", () => {
    it("should return basketball icon", () => {
      const icon = getSportIcon("basketball");
      expect(icon).toBe("🏀");
    });

    it("should log an error and return an empty string if sport is not found", () => {
      const icon = getSportIcon("ice-hockey");
      expect(icon).toBe("");
    });
  });
});
