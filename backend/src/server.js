import app from "./app.js";
import { assertRequiredEnv } from "./config/env.js";

assertRequiredEnv();

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
