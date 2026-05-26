import { createUploadthing, type FileRouter } from "uploadthing/next";
import { supabaseServer } from "@/lib/supabase/server";

const f = createUploadthing();

const auth = async (req: Request) => {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return { userId: "mock-user-id" };
  }
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");
  return { userId: user.id };
};

export const ourFileRouter = {
  avatar: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => await auth(req))
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  materials: f({
    image: { maxFileSize: "16MB", maxFileCount: 8 },
    video: { maxFileSize: "128MB", maxFileCount: 2 },
    pdf: { maxFileSize: "64MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => await auth(req))
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Materials upload complete for userId:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
