import { getDb } from "../api/queries/connection";
import * as schema from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Example: insert seed data
  // await db.insert(schema.destinations).values([
  //   { userId: "seed-user", destination: "Tokyo", category: "Travel", status: "Planning" },
  // ]);

  console.log("Done.");
  process.exit(0);
}

seed();
