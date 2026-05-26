import * as schema from "@/drizzle/schema";

/**
 * Para evoluir para produção:
 *
 *   import { drizzle } from "drizzle-orm/postgres-js";
 *   import postgres from "postgres";
 *
 *   const client = postgres(process.env.DATABASE_URL!, { prepare: false });
 *   export const db = drizzle(client, { schema });
 *
 * Por hora o app roda com mock data (NEXT_PUBLIC_USE_MOCK_DATA=true).
 */

export { schema };
