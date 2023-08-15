import useSWR from "swr";
import styles from "./page.module.css";
// import { fetchRolesMod } from "zodiac-roles-sdk";
import { notFound } from "next/navigation";
import parseModParam from "../parseModParam";
import RolesTable from "@/components/RolesTable";

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
        members: [address, address],
        targets: [address, address, address],
      },
      {
        key: "test-role-1",
        members: [address],
        targets: [address, address],
      },
    ],
  });
};

export default async function RolesList({
  params,
}: {
  params: { mod: string };
}) {
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
      <RolesTable roles={data.roles} mod={params.mod} />
    </main>
  );
}
