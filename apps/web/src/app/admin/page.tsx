import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminPanel } from "./admin-panel";
import { ROLES } from "@interview-prep/config/constants";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== ROLES.ADMIN) {
    redirect("/");
  }

  return <AdminPanel />;
}
