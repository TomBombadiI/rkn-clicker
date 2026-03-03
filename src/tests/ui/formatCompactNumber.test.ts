import { describe, expect, it } from "vitest";
import { formatCompactNumber } from "../../ui/shared/format/formatCompactNumber";

describe("formatCompactNumber", () => {
  it("keeps small values readable without suffixes (smoke)", () => {
    expect(formatCompactNumber(999)).toBe("999");
    expect(formatCompactNumber(42.4)).toBe("42");
  });

  it("shortens large values with compact suffixes (regression guard)", () => {
    expect(formatCompactNumber(1_200)).toBe("1,2K");
    expect(formatCompactNumber(2_500_000)).toBe("2,5M");
    expect(formatCompactNumber(7_000_000_000)).toBe("7B");
    expect(formatCompactNumber(3_400_000_000_000)).toBe("3,4T");
  });
});
