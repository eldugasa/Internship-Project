
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();
console.log("Current directory:", process.cwd());
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Not loaded");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Loaded" : "❌ Not loaded");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
