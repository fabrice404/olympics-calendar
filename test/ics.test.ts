import * as fs from "fs";
import { afterEach, beforeEach, describe } from "node:test";
import { expect, it, vi, MockInstance } from "vitest";

import { generateICS } from "../src/ics";

import { Event } from "../src/types";

describe("ics", () => {
  let mkdirMock: MockInstance;
  let writeFileMock: MockInstance;

  beforeEach(() => {
    vi.mock("fs");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("generateICS", () => {
    mkdirMock = vi.spyOn(fs, "mkdirSync").mockImplementation(() => "");
    writeFileMock = vi.spyOn(fs, "writeFileSync").mockImplementation(() => null);
    it("should generate empty ICS file", () => {
      generateICS("title", "sport/key", []);

      expect(mkdirMock).toHaveBeenCalledWith(
        expect.stringMatching("docs/sport"),
        { recursive: true },
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringMatching("docs/sport/key.ics"),
        expect.any(String),
      );
    });

    it("should generate ICS file with events", () => {
      const events: Event[] = [{
        UID: "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890",
        DTSTAMP: "20240801T000000Z",
        DTSTART: "20240801T000000Z",
        DTEND: "20240801T200000Z",
        SUMMARY: "Event 1",
        DESCRIPTION: "Description that's is very long, longer than 75 characters, to test if it's gonna be split appropriately",
        LOCATION: "Location 1",
        _COMPETITORS: [],
        _GENDER: "",
        _MEDAL: false,
        _NOCS: [],
        _SPORT: "sport",
        _UNITNAME: "unit",
      }];
      generateICS("title", "sport/key", events);

      expect(mkdirMock).toHaveBeenCalledWith(
        expect.stringMatching("docs/sport"),
        { recursive: true },
      );
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringMatching("docs/sport/key.ics"),
        expect.any(String),
      );
    });
  });
});
