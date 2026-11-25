const path = require("path");
const fs = require("fs");

// Serve React build in production
const buildDir = path.join(__dirname, "..", "client", "build");
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildDir, "index.html"));
  });
}
