const getConnection = require("./oracle.js");

async function test() {
  try {
    console.log("Connecting to Oracle database...");
    const conn = await getConnection();
    console.log("✓ Database connected successfully!");
    
    const result = await conn.execute("SELECT * FROM materials");
    console.log("\nMaterials found:", result.rows.length);
    console.log(result.rows);
    
    await conn.close();
    console.log("\n✓ Connection closed");
  } catch (err) {
    console.error("✗ Database error:", err.message);
    console.error("\nTroubleshooting:");
    console.error("1. Ensure Oracle Database is running");
    console.error("2. Check credentials: user='studyhub', password='studyhub2026'");
    console.error("3. Verify connection string: 'localhost/XE'");
    console.error("4. For older Oracle versions, install Oracle Instant Client:");
    console.error("   https://www.oracle.com/database/technologies/instant-client/downloads.html");
  }
}

test();
