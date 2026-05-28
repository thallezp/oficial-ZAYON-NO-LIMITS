import * as schema from "@/drizzle/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Inicializacao lazy do cliente Drizzle.
 *
 * Motivo: durante o build do Next no Vercel, a fase "Collecting page data"
 * importa cada route handler. Se o cliente postgres for criado no top-level,
 * uma DATABASE_URL ausente ou malformada (ex: query fragment perdido) quebra
 * o build inteiro com `new URL("=true&connection_limit=1")` -> ERR_INVALID_URL.
 *
 * Solucao: so chamamos `postgres()` quando alguem realmente acessa `db`.
 * Routes que nao executam queries no build (a maioria) continuam compilando
 * normalmente.
 */

let cachedClient: ReturnType<typeof postgres> | null = null;
let cachedDb: ReturnType<typeof drizzle> | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    return null;
  }
  try {
    cachedClient = postgres(connectionString, { prepare: false });
    return cachedClient;
  } catch {
    return null;
  }
}

function getDb() {
  if (cachedDb) return cachedDb;
  const client = getClient();
  if (!client) return null;
  cachedDb = drizzle(client, { schema });
  return cachedDb;
}

/**
 * Proxy que adia a inicializacao do Drizzle ate o primeiro uso.
 * Codigo existente (`db.select().from(...)`) continua funcionando.
 */
export const db: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const real = getDb();
      if (!real) {
        throw new Error(
          "DATABASE_URL nao configurada ou invalida. Drizzle nao pode rodar.",
        );
      }
      const value = (real as any)[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  },
);

export { schema };
