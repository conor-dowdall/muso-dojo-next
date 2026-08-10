// @vitest-environment jsdom

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useControllableState } from "@/hooks/useControllableState";

afterEach(cleanup);

describe("useControllableState", () => {
  it("updates uncontrolled state and reports resolved functional values", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 2, onChange }),
    );

    act(() => result.current[1]((previous) => previous + 3));

    expect(result.current[0]).toBe(5);
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("reports controlled changes without mutating the rendered value", () => {
    const onChange = vi.fn();
    const { rerender, result } = renderHook(
      ({ value }: { value: number }) =>
        useControllableState({ defaultValue: 2, onChange, value }),
      { initialProps: { value: 4 } },
    );

    act(() => result.current[1]((previous) => previous + 1));

    expect(result.current[0]).toBe(4);
    expect(onChange).toHaveBeenCalledWith(5);

    rerender({ value: 5 });
    expect(result.current[0]).toBe(5);
  });

  it("supports explicitly controlled undefined values via the default", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<string>({
        controlled: true,
        defaultValue: "fallback",
        onChange,
        value: undefined,
      }),
    );

    act(() => result.current[1]("next"));

    expect(result.current[0]).toBe("fallback");
    expect(onChange).toHaveBeenCalledWith("next");
  });
});
