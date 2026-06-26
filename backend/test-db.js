const db = require("./db/postgres");

async function test() {
  try {
    console.log("Connecting to PostgreSQL database...");
    
    const result = await db.query(
      `SELECT
         id,
         title,
         description,
         type,
         format,
         file_path,
         link,
         thumbnail,
         download_count,
         created_at
       FROM materials`
    );

    console.log(`\nMaterials found: ${result.rows.length}`);

    for (const row of result.rows) {
      console.log(row);
    }

    console.log("\n✓ Database connected successfully!");
  } catch (err) {
    console.error("✗ Database error:", err.message || err);
  } finally {
    try {
      await db.pool.end();
      console.log("\n✓ Connection closed");
    } catch (closeErr) {
      console.error("Error closing pool:", closeErr);
    }
  }
}

test();
