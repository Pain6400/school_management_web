import { redirect } from "next/navigation";

export default function LegacyTeacherRolesRedirect() {
  redirect("/school/roles");
}
