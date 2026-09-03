import { buildActiveFaults } from "./builders.js";

export async function buildFmsActive() {
  return await buildActiveFaults();
}
