import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { readFileSync } from "fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
let testEnv;
const RULES = readFileSync("firestore.rules", "utf8");
async function seedUser(uid, role) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), {
      role,
      username: `${role}-user`,
      status: "active"
    });
  });
}
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "gym-management-test",
    firestore: {
      rules: RULES,
      host: "127.0.0.1",
      port: 8080
    }
  });
});
afterAll(async () => {
  await testEnv?.cleanup();
});
beforeEach(async () => {
  await testEnv.clearFirestore();
});
describe("Unauthenticated", () => {
  const COLLECTIONS = [
    "users",
    "members",
    "attendance",
    "classes",
    "class_bookings",
    "trainers",
    "equipment",
    "membership_plans",
    "payments",
    "workout_plans",
    "diet_plans",
    "settings",
    "system_logs"
  ];
  COLLECTIONS.forEach((name) => {
    it(`read ${name} is denied`, async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(getDocs(collection(unauthDb, name)));
    });
    it(`write to ${name} is denied`, async () => {
      const unauthDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(addDoc(collection(unauthDb, name), { test: true }));
    });
  });
});
describe("User role", () => {
  const UID = "user-alice";
  const OTHER_UID = "user-bob";
  beforeEach(async () => {
    await seedUser(UID, "user");
    await seedUser(OTHER_UID, "user");
  });
  it("can read own profile", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, "users", UID)));
  });
  it("cannot read another user profile", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDoc(doc(db, "users", OTHER_UID)));
  });
  it("cannot self-promote role", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, "users", UID), { role: "admin" }));
  });
  it("can update own username", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(updateDoc(doc(db, "users", UID), { username: "newname" }));
  });
  it("cannot create a doc for another user", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, "users", "new-random-uid"), { role: "user" }));
  });
  const BUSINESS = [
    "members",
    "attendance",
    "classes",
    "class_bookings",
    "trainers",
    "equipment",
    "payments",
    "workout_plans",
    "diet_plans",
    "membership_plans"
  ];
  BUSINESS.forEach((name) => {
    it(`can read ${name} (legacy open rules)`, async () => {
      const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
      await assertSucceeds(getDocs(collection(db, name)));
    });
  });
  it("cannot read system_logs", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDocs(collection(db, "system_logs")));
  });
  it("can create system_logs (audit writes allowed for verified users)", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(addDoc(collection(db, "system_logs"), { level: "info", message: "x" }));
  });
  it("can read settings", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "settings", "gym"), { name: "GYMPRO" });
    });
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, "settings", "gym")));
  });
});
describe("Staff role", () => {
  const UID = "staff-carol";
  beforeEach(async () => {
    await seedUser(UID, "staff");
  });
  const STAFF_CRUD = [
    "members",
    "attendance",
    "classes",
    "class_bookings",
    "trainers",
    "equipment",
    "payments",
    "workout_plans",
    "diet_plans"
  ];
  STAFF_CRUD.forEach((name) => {
    it(`can read ${name}`, async () => {
      const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
      await assertSucceeds(getDocs(collection(db, name)));
    });
    it(`can create in ${name}`, async () => {
      const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
      await assertSucceeds(addDoc(collection(db, name), { test: true }));
    });
  });
  it("can read membership_plans", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(getDocs(collection(db, "membership_plans")));
  });
  it("can write membership_plans (legacy rules open during migration)", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(addDoc(collection(db, "membership_plans"), { name: "x", price: 1 }));
  });
  it("can read settings", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "settings", "gym"), { name: "G" });
    });
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, "settings", "gym")));
  });
  it("can write settings (legacy rules open during migration)", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(db, "settings", "gym"), { name: "Hacked" }));
  });
  it("can create system_logs", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(addDoc(collection(db, "system_logs"), { level: "info", message: "hello", user_name: "staff", action: "test" }));
  });
  it("cannot read system_logs", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDocs(collection(db, "system_logs")));
  });
  it("can read own profile", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(getDoc(doc(db, "users", UID)));
  });
  it("cannot update own role", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, "users", UID), { role: "admin" }));
  });
  it("cannot read another user profile", async () => {
    await seedUser("other-uid", "user");
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDoc(doc(db, "users", "other-uid")));
  });
});
describe("Manager role", () => {
  const UID = "mgr-dave";
  beforeEach(async () => {
    await seedUser(UID, "manager");
  });
  it("can write membership_plans", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(addDoc(collection(db, "membership_plans"), { name: "Gold", price: 99 }));
  });
  it("can write settings", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(db, "settings", "gym"), { name: "GYMPRO" }));
  });
  it("cannot read system_logs without org manager membership", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await addDoc(collection(ctx.firestore(), "system_logs"), { level: "info", message: "x", user_name: "mgr", action: "test", created_at: "2026-01-01" });
    });
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDocs(collection(db, "system_logs")));
  });
  it("cannot create another user doc (no privilege escalation)", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, "users", "new-staff"), { role: "staff", username: "new", status: "active" }));
  });
  it("cannot update another user", async () => {
    await seedUser("target-user", "staff");
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, "users", "target-user"), { status: "inactive" }));
  });
  it("cannot delete a user", async () => {
    await seedUser("to-delete", "user");
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(deleteDoc(doc(db, "users", "to-delete")));
  });
});
describe("Owner role", () => {
  const UID = "owner-eve";
  beforeEach(async () => {
    await seedUser(UID, "owner");
  });
  it("cannot change own role via client (role changes require trusted backend)", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, "users", UID), { role: "user" }));
  });
  it("cannot list all users (only platform admin may)", async () => {
    await seedUser("another", "staff");
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDocs(collection(db, "users")));
  });
});
describe("Catch-all denies unknown collections", () => {
  const UID = "anyone";
  beforeEach(async () => {
    await seedUser(UID, "owner");
  });
  it("read unknown collection denied", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(getDocs(collection(db, "secret_data")));
  });
  it("write unknown collection denied", async () => {
    const db = testEnv.authenticatedContext(UID, { email_verified: true }).firestore();
    await assertFails(addDoc(collection(db, "secret_data"), { x: 1 }));
  });
});
