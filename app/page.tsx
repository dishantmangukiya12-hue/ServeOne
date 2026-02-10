import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);

  // Logged-in users go to dashboard, visitors see landing page
  if (session?.user) {
    redirect("/home");
  }

  redirect("/landing");
}
