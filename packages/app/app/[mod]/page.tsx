import styles from "./page.module.css";
// import { fetchRolesMod } from "zodiac-roles-sdk";
import { notFound } from "next/navigation";
import parseModParam from "@/app/parseModParam";
import RolesList from "@/components/RolesList";

interface RoleSummary {
  key: string;
  members: `0x${string}`[];
  targets: `0x${string}`[];
}

// TODO replace with real fetch once the subgraphs are available
const fetchRolesMod = async ({ address }: { address: `0x${string}` }) => {
  return Promise.resolve({
    address,
    owner: address,
    avatar: address,
    target: address,
    roles: [
      {
        key: "test-role-0",
        members: [
          "0xCC03A88d617A9FcCad51aA9658FDC5a09e62597e",
          "0xDE70A3184C235a86D6355658F863c28cF3dbceed",
        ],
        targets: [
          "0x080bC5dd5459b8dfbaF2aA86d3c4e7331196d134",
          "0x3d1644042d59D0B7ebD27050c428f26d5f09834e",
          "0x563B5d7c60110B28b42b52A34dE3Ea84548733C6",
        ],
      },
      {
        key: "test-role-1",
        members: ["0xCC03A88d617A9FcCad51aA9658FDC5a09e62597e"],
        targets: [
          "0x080bC5dd5459b8dfbaF2aA86d3c4e7331196d134",
          "0x3d1644042d59D0B7ebD27050c428f26d5f09834e",
        ],
      },
    ] as RoleSummary[],
  });
};

export default async function ModPage({ params }: { params: { mod: string } }) {
  const mod = parseModParam(params.mod);
  if (!mod) {
    notFound();
  }

  const data = await fetchRolesMod(mod);
  if (!data) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <RolesList roles={data.roles} mod={params.mod} />
    </main>
  );
}
