import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

export type Presence = {
  cursor: { x: number; y: number } | null;
  typing: boolean;
};

export type Storage = {
  // Add room storage if needed
};

export type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar: string;
  };
};

export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useSelf,
  useUser,
  useThreads,
} = createRoomContext<Presence, Storage, UserMeta, any, any>(client);
