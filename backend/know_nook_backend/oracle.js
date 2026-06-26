const oracledb = require("oracledb");

// Enable Thick mode for compatibility with older Oracle versions
try {
  oracledb.initOracleClient();
} catch (err) {
  console.warn("Oracle Instant Client not found, using Thin mode");
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: "studyhub",
  password: "studyhub2026",
  connectString: "localhost/XE"
};

async function getConnection() {
  try {
    return await oracledb.getConnection(dbConfig);
  } catch (err) {
    console.error("Failed to connect to Oracle Database:", err.message);
    throw err;
  }
}

module.exports = getConnection;
