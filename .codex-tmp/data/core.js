export const MOCK_USERS = [
    {
        id: "u_owner",
        email: "alex@nexus.team",
        fullName: "Alex Vega",
        role: "owner",
        online: true,
        avatarUrl: "",
    },
    {
        id: "u_strat",
        email: "marina@nexus.team",
        fullName: "Marina Castro",
        role: "admin",
        online: true,
    },
    {
        id: "u_copy",
        email: "lucas@nexus.team",
        fullName: "Lucas Hoffman",
        role: "editor",
        online: false,
    },
    {
        id: "u_design",
        email: "sofia@nexus.team",
        fullName: "Sofia Marques",
        role: "editor",
        online: true,
    },
    {
        id: "u_video",
        email: "rafael@nexus.team",
        fullName: "Rafael Tavares",
        role: "editor",
        online: false,
    },
    {
        id: "u_fin",
        email: "joana@nexus.team",
        fullName: "Joana Almeida",
        role: "financeiro",
        online: true,
    },
];
export const CURRENT_USER = MOCK_USERS[0];
export const MOCK_WORKSPACES = [
    {
        id: "ws_nexus",
        name: "NEXUS HQ",
        slug: "nexus",
        description: "Operação principal — equipe interna",
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
export const userById = (id) => MOCK_USERS.find((u) => u.id === id) ?? MOCK_USERS[0];
