import { describe, it, expect, vi, beforeEach } from "vitest";
const mockApi = vi.fn();
vi.mock("../api", () => ({
  api: (...args) => mockApi(...args)
}));
const mockMemberList = vi.fn();
const mockEquipmentList = vi.fn();
vi.mock("../services", () => ({
  memberService: { list: (...args) => mockMemberList(...args) },
  equipmentService: { list: (...args) => mockEquipmentList(...args) }
}));
import {
  mergeRead,
  fetchNotifications,
  fetchReadIds,
  markNotificationsRead
} from "../notifications";
beforeEach(() => {
  mockApi.mockReset();
  mockMemberList.mockReset();
  mockEquipmentList.mockReset();
});
describe("mergeRead (pure)", () => {
  const notifs = [
    { id: "a", category: "membership", title: "A", body: "", link: "", severity: "warning", sort_ts: 3 },
    { id: "b", category: "membership", title: "B", body: "", link: "", severity: "warning", sort_ts: 2 },
    { id: "c", category: "equipment", title: "C", body: "", link: "", severity: "critical", sort_ts: 1 }
  ];
  it("marks matching ids as read and computes unreadCount", () => {
    const { all, unreadCount } = mergeRead(notifs, ["b"]);
    expect(unreadCount).toBe(2);
    expect(all.find((n) => n.id === "a")?.read).toBe(false);
    expect(all.find((n) => n.id === "b")?.read).toBe(true);
    expect(all.find((n) => n.id === "c")?.read).toBe(false);
  });
  it("treats every notification as unread when readIds is empty", () => {
    const { all, unreadCount } = mergeRead(notifs, []);
    expect(unreadCount).toBe(3);
    expect(all.every((n) => !n.read)).toBe(true);
  });
  it("reports 0 unread when every id is marked", () => {
    const { all, unreadCount } = mergeRead(notifs, ["a", "b", "c"]);
    expect(unreadCount).toBe(0);
    expect(all.every((n) => n.read)).toBe(true);
  });
  it("ignores unknown read ids", () => {
    const { unreadCount } = mergeRead(notifs, ["unknown-id"]);
    expect(unreadCount).toBe(3);
  });
});
describe("fetchNotifications \u2014 membership category", () => {
  const futureISO = new Date(Date.now() + 30 * 864e5).toISOString();
  const soonISO = new Date(Date.now() + 3 * 864e5).toISOString();
  const pastISO = new Date(Date.now() - 5 * 864e5).toISOString();
  const members = (rows) => mockMemberList.mockResolvedValueOnce(rows.map((r, i) => ({ id: `m${i}`, ...r })));
  it("includes expired and expiring active members", async () => {
    members([
      { name: "Alice", status: "Active", expiry_date: pastISO },
      { name: "Bob", status: "Active", expiry_date: soonISO }
    ]);
    const result = await fetchNotifications({ membership: true, equipment: false });
    expect(result).toHaveLength(2);
    const titles = result.map((n) => n.title).join(" | ");
    expect(titles).toMatch(/Alice's membership expired/);
    expect(titles).toMatch(/Bob's membership expires soon/);
    expect(result.every((n) => n.category === "membership")).toBe(true);
  });
  it("skips inactive members (they no longer need renewal nudges)", async () => {
    members([{ name: "Alice", status: "Inactive", expiry_date: pastISO }]);
    const result = await fetchNotifications({ membership: true, equipment: false });
    expect(result).toHaveLength(0);
  });
  it("skips active members far from expiry", async () => {
    members([{ name: "Alice", status: "Active", expiry_date: futureISO }]);
    const result = await fetchNotifications({ membership: true, equipment: false });
    expect(result).toHaveLength(0);
  });
  it("skips members with no expiry_date", async () => {
    members([{ name: "Alice", status: "Active", expiry_date: null }]);
    const result = await fetchNotifications({ membership: true, equipment: false });
    expect(result).toHaveLength(0);
  });
  it('uses "expired" severity=critical and "expiring" severity=warning', async () => {
    members([
      { name: "X", status: "Active", expiry_date: pastISO },
      { name: "Y", status: "Active", expiry_date: soonISO }
    ]);
    const result = await fetchNotifications({ membership: true, equipment: false });
    const expired = result.find((n) => n.id === "member:m0");
    const expiring = result.find((n) => n.id === "member:m1");
    expect(expired?.severity).toBe("critical");
    expect(expiring?.severity).toBe("warning");
  });
});
describe("fetchNotifications \u2014 equipment category", () => {
  const pastISO = new Date(Date.now() - 2 * 864e5).toISOString();
  const futureISO = new Date(Date.now() + 30 * 864e5).toISOString();
  const equipment = (rows) => mockEquipmentList.mockResolvedValueOnce(rows.map((r, i) => ({ id: `e${i}`, ...r })));
  it("flags broken equipment as critical", async () => {
    equipment([{ name: "Bench Press", status: "broken", next_maintenance: null }]);
    const result = await fetchNotifications({ membership: false, equipment: true });
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("critical");
    expect(result[0].category).toBe("equipment");
    expect(result[0].link).toBe("/equipment");
  });
  it("flags overdue scheduled maintenance", async () => {
    equipment([{ name: "Treadmill", status: "operational", next_maintenance: pastISO }]);
    const result = await fetchNotifications({ membership: false, equipment: true });
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe("warning");
    expect(result[0].title).toMatch(/Treadmill needs attention/);
  });
  it("ignores operational equipment with a future service date", async () => {
    equipment([{ name: "Rack", status: "operational", next_maintenance: futureISO }]);
    const result = await fetchNotifications({ membership: false, equipment: true });
    expect(result).toHaveLength(0);
  });
});
describe("fetchNotifications \u2014 combined + sorting", () => {
  it("returns [] when neither category is enabled", async () => {
    const result = await fetchNotifications({ membership: false, equipment: false });
    expect(result).toEqual([]);
  });
  it("merges both categories sorted by sort_ts descending", async () => {
    const pastISO = new Date(Date.now() - 5 * 864e5).toISOString();
    const overdueISO = new Date(Date.now() - 1 * 864e5).toISOString();
    mockMemberList.mockResolvedValueOnce([
      { id: "m1", name: "OldExpiry", status: "Active", expiry_date: pastISO }
    ]);
    mockEquipmentList.mockResolvedValueOnce([
      { id: "e1", name: "RecentOverdue", status: "broken", next_maintenance: overdueISO }
    ]);
    const result = await fetchNotifications({ membership: true, equipment: true });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("equip:e1");
    expect(result[1].id).toBe("member:m1");
  });
  it("swallows service failures and returns [] for that category", async () => {
    mockMemberList.mockRejectedValueOnce(new Error("network"));
    const result = await fetchNotifications({ membership: true, equipment: false });
    expect(result).toEqual([]);
  });
});
describe("fetchReadIds", () => {
  it("returns [] when the state request fails", async () => {
    mockApi.mockRejectedValueOnce(new Error("offline"));
    expect(await fetchReadIds("uid-1")).toEqual([]);
  });
  it("returns the persisted readIds array", async () => {
    mockApi.mockResolvedValueOnce({ readIds: ["member:x", "equip:y"] });
    expect(await fetchReadIds("uid-1")).toEqual(["member:x", "equip:y"]);
  });
  it("returns [] when readIds is missing", async () => {
    mockApi.mockResolvedValueOnce({});
    expect(await fetchReadIds("uid-1")).toEqual([]);
  });
});
describe("markNotificationsRead", () => {
  it("no-ops when given an empty list (avoids a pointless API call)", async () => {
    await markNotificationsRead([]);
    expect(mockApi).not.toHaveBeenCalled();
  });
  it("filters out falsy ids before posting", async () => {
    mockApi.mockResolvedValueOnce({ readIds: ["a", "b"] });
    await markNotificationsRead(["", "a", "", "b"]);
    expect(mockApi).toHaveBeenCalledTimes(1);
    const [path, opts] = mockApi.mock.calls[0];
    expect(path).toBe("/api/me/notification-state/read");
    expect(opts.body.ids).toEqual(["a", "b"]);
  });
});
