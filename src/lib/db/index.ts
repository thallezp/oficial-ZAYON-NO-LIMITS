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

/**
 * Normaliza a DATABASE_URL re-encodando o usuário e a senha.
 *
 * Bug que isso resolve: senhas com caracteres especiais não-encodados
 * (ex: "@Matificante1002" — começa com @) quebram o parser de URL do
 * postgres-js. A authority `user:@senha@host` é ambígua e o cliente falha
 * ao conectar → todas as leituras via Drizzle retornavam 500 e a UI ficava
 * vazia. Aqui isolamos userinfo pelo ÚLTIMO "@" (o que separa do host),
 * decodificamos (idempotente p/ valor já encodado) e re-encodamos de forma
 * segura. Funciona com a senha crua OU já encodada na env var.
 */
function normalizeConnectionString(raw: string): string {
  const schemeMatch = raw.match(/^postgres(?:ql)?:\/\//i);
  if (!schemeMatch) return raw;
  const scheme = schemeMatch[0];
  const rest = raw.slice(scheme.length);

  const lastAt = rest.lastIndexOf("@");
  if (lastAt === -1) return raw; // sem userinfo
  const userinfo = rest.slice(0, lastAt);
  const hostAndPath = rest.slice(lastAt + 1);

  const firstColon = userinfo.indexOf(":");
  if (firstColon === -1) return raw; // sem senha explícita
  const user = userinfo.slice(0, firstColon);
  const rawPass = userinfo.slice(firstColon + 1);

  const safeDecode = (v: string) => {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const encUser = encodeURIComponent(safeDecode(user));
  const encPass = encodeURIComponent(safeDecode(rawPass));

  return `${scheme}${encUser}:${encPass}@${hostAndPath}`;
}

/**
 * Limpa o valor cru da env var: alguns ambientes (ex: painel da Vercel) guardam
 * o valor COM aspas literais ou espaços/quebras de linha em volta. Isso fazia o
 * regex `^postgres://` falhar e o Drizzle era desativado → todas as leituras
 * retornavam 500 e a UI ficava vazia.
 */
function cleanEnvValue(v: string): string {
  let s = v.trim();
  // remove aspas simples/duplas em volta (uma ou mais vezes)
  while (
    s.length >= 2 &&
    ((s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")) ||
      (s.startsWith("`") && s.endsWith("`")))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function getClient() {
  if (cachedClient) return cachedClient;
  const rawEnv = process.env.DATABASE_URL;
  const connectionString = rawEnv ? cleanEnvValue(rawEnv) : "";
  if (!connectionString || !/^postgres(ql)?:\/\//i.test(connectionString)) {
    // Log diagnóstico SEM expor segredo (só metadados do valor).
    console.error(
      "[db] DATABASE_URL inválida/ausente.",
      JSON.stringify({
        isSet: rawEnv != null,
        rawLength: rawEnv?.length ?? 0,
        cleanedLength: connectionString.length,
        startsWith: connectionString.slice(0, 13),
      }),
    );
    return null;
  }
  try {
    cachedClient = postgres(normalizeConnectionString(connectionString), {
      prepare: false,
    });
    return cachedClient;
  } catch (err) {
    console.error("[db] Falha ao inicializar o cliente postgres:", err);
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
