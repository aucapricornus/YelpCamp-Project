import { app } from "./app";
import { connectDB } from "./config/db";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Add it to backend/.env");
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server running on port ${PORT}`);
});
