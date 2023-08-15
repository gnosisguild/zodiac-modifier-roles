import { LinkButton } from "@/components/Button";

export default function NotFound() {
  return (
    <div>
      <h2>There&apos;s nothing here!</h2>
      <p>Could not find a Roles Mod at the requested address</p>
      <LinkButton href="/">Connect a Roles Mod</LinkButton>
    </div>
  );
}
