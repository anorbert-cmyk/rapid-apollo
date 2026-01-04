import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const result = await connection.execute(
  "SELECT sessionId, LENGTH(part1) as p1, LENGTH(part2) as p2, LENGTH(part3) as p3, LENGTH(part4) as p4, LENGTH(part5) as p5, LENGTH(part6) as p6 FROM analysis_results WHERE sessionId = 'test-apex-demo-LAIdJqey'"
);

console.log("Demo data lengths:", result[0]);

// Check if part5 and part6 have content
const fullResult = await connection.execute(
  "SELECT part5, part6 FROM analysis_results WHERE sessionId = 'test-apex-demo-LAIdJqey'"
);

const row = fullResult[0][0];
console.log("\nPart 5 content (first 200 chars):", row?.part5?.substring(0, 200) || "EMPTY");
console.log("\nPart 6 content (first 200 chars):", row?.part6?.substring(0, 200) || "EMPTY");

await connection.end();
