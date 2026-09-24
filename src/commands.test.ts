import { describe, expect, it } from "vitest";

import { commandPayloads } from "./commands.js";

describe("command registry", () => {
  it("includes the foundation and administration command surface", () => {
    const names = commandPayloads.map((command) => command.name);

    expect(names).toContain("ping");
    expect(names).toContain("status");
    expect(names).toContain("ask");
    expect(names).toContain("server-setup");
    expect(names).toContain("channel-create");
    expect(names).toContain("role-create");
    expect(names).toContain("create-role");
    expect(names).toContain("member-timeout");
    expect(names).toContain("messages-purge");
    expect(names).toContain("audit-log");
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(26);
  });
});
