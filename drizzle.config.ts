import type { Config } from "drizzle-kit";

export default {
  schema: "./src/drizzle/schema/*",
  out: "./src/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/zayon",
  },
  strict: true,
  verbose: true,
} satisfies Config;
