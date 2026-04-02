import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/login"); // or "/auth/login" if that's your route
}