import type { User, Workspace } from "@/types";

export const MOCK_USERS: User[] = [
  {
    id: "22222222-2222-2222-2222-222222222201",
    email: "alex@zayon.team",
    fullName: "Alex Vega",
    role: "owner",
    online: true,
    avatarUrl: "",
  },
  {
    id: "22222222-2222-2222-2222-222222222202",
    email: "marina@zayon.team",
    fullName: "Marina Castro",
    role: "admin",
    online: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222203",
    email: "lucas@zayon.team",
    fullName: "Lucas Hoffman",
    role: "editor",
    online: false,
  },
  {
    id: "22222222-2222-2222-2222-222222222204",
    email: "sofia@zayon.team",
    fullName: "Sofia Marques",
    role: "editor",
    online: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222205",
    email: "rafael@zayon.team",
    fullName: "Rafael Tavares",
    role: "editor",
    online: false,
  },
  {
    id: "22222222-2222-2222-2222-222222222206",
    email: "joana@zayon.team",
    fullName: "Joana Almeida",
    role: "financeiro",
    online: true,
  },
];

export const CURRENT_USER = MOCK_USERS[0];

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "ZAYON HQ",
    slug: "zayon",
    description: "OperaÃ§Ã£o principal â€” equipe interna",
    ownerId: MOCK_USERS[0].id,
    plan: "Premium",
    createdAt: "2025-01-12T10:00:00Z",
  },
  {
    id: "ws_atelier",
    name: "Atelier 03",
    slug: "atelier",
    description: "Sub-workspace para experimentos",
    ownerId: MOCK_USERS[0].id,
    plan: "Premium",
    createdAt: "2025-08-22T10:00:00Z",
  },
];

export const userById = (id?: string) =>
  MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[0];

