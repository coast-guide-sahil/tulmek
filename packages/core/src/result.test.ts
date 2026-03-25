import { describe, it, expect } from "vitest";
import { Ok, Err } from "./result";
import type { Result } from "./result";

describe("Result", () => {
  describe("Ok", () => {
    it("creates a success result with the given value", () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it("works with string values", () => {
      const result = Ok("hello");
      expect(result).toEqual({ ok: true, value: "hello" });
    });

    it("works with object values", () => {
      const data = { id: 1, name: "test" };
      const result = Ok(data);
      expect(result).toEqual({ ok: true, value: data });
    });

    it("works with boolean true", () => {
      const result = Ok(true);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });
  });

  describe("Err", () => {
    it("creates a failure result with the given error", () => {
      const result = Err("something went wrong");
      expect(result.ok).toBe(false);
      expect(result).toEqual({ ok: false, error: "something went wrong" });
    });

    it("works with error objects", () => {
      const error = { code: "NOT_FOUND", message: "Not found" };
      const result = Err(error);
      expect(result).toEqual({ ok: false, error });
    });
  });

  describe("type narrowing", () => {
    it("narrows to Ok branch when ok is true", () => {
      const result: Result<number, string> = Ok(42);
      if (result.ok) {
        // TypeScript should narrow to { ok: true, value: number }
        expect(result.value).toBe(42);
      } else {
        throw new Error("Should not reach here");
      }
    });

    it("narrows to Err branch when ok is false", () => {
      const result: Result<number, string> = Err("fail");
      if (!result.ok) {
        // TypeScript should narrow to { ok: false, error: string }
        expect(result.error).toBe("fail");
      } else {
        throw new Error("Should not reach here");
      }
    });
  });
});
