import { describe, expect, it, vi } from "vitest";
import { registerWithHoloSuite } from "../../src/integration/holosuite";

describe("HoloSuite registration adapter", () => {
  it("registers one player-visible tile with role-specific opening", () => {
    const registerApp = vi.fn((value) => value);
    const openManager = vi.fn();
    const openReader = vi.fn();
    const adapter = { getApi: () => ({ registerApp }), currentUserIsGM: () => true, openManager, openReader };

    expect(registerWithHoloSuite(adapter)).toBe(true);
    expect(registerWithHoloSuite(adapter)).toBe(true);
    expect(registerApp).toHaveBeenCalledTimes(1);
    const registration = registerApp.mock.calls[0]?.[0];
    expect(registration).toMatchObject({ id: "holosuite-news", playerVisible: true, premium: false, featureId: "holosuite-news" });
    registration.open();
    expect(openManager).toHaveBeenCalledOnce();
    expect(openReader).not.toHaveBeenCalled();
  });

  it("waits safely when the Core API is absent", () => {
    expect(registerWithHoloSuite({ getApi: () => null, currentUserIsGM: () => false, openManager: vi.fn(), openReader: vi.fn() })).toBe(false);
  });

  it("registers again when HoloSuite replaces its API instance", () => {
    const first = { registerApp: vi.fn() };
    const second = { registerApp: vi.fn() };
    let api = first;
    const adapter = { getApi: () => api, currentUserIsGM: () => false, openManager: vi.fn(), openReader: vi.fn() };
    expect(registerWithHoloSuite(adapter)).toBe(true);
    api = second;
    expect(registerWithHoloSuite(adapter)).toBe(true);
    expect(first.registerApp).toHaveBeenCalledOnce();
    expect(second.registerApp).toHaveBeenCalledOnce();
  });
});
