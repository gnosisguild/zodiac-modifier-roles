import styles from "./page.module.css";
// import { fetchRole } from "zodiac-roles-sdk";
import { notFound } from "next/navigation";
import parseModParam from "@/app/parseModParam";
import { Role, fetchRolesMod } from "zodiac-roles-sdk";
import Flex from "@/components/Flex";
import Box from "@/components/Box";
import MembersList from "@/components/MembersList";
import { testTargets, testAnnotations } from "./testData";

// TODO replace with real fetch once the subgraphs are available
const fetchRole = async ({
  address,
  roleKey,
}: {
  address: `0x${string}`;
  roleKey: string;
}) => {
  return Promise.resolve({
    key: roleKey,
    members: [
      "0xCC03A88d617A9FcCad51aA9658FDC5a09e62597e",
      "0xDE70A3184C235a86D6355658F863c28cF3dbceed",
    ],
    targets: testTargets,
    allowances: [],
    annotations: testAnnotations,
  } as Role);
};

export default async function RolePage({
  params,
}: {
  params: { mod: string; role: string };
}) {
  const mod = parseModParam(params.mod);
  if (!mod) {
    notFound();
  }

  const data = await fetchRole({ ...mod, roleKey: params.role });
  if (!data) {
    const modExists = await fetchRolesMod(mod);
    if (!modExists) notFound();
  }

  return (
    <main className={styles.main}>
      <Flex gap={1}>
        <Box>
          <h5>Members</h5>
          <MembersList members={data.members} chainId={mod.chainId} />
        </Box>
        <Box>
          <h5>Permissions</h5>
          <PermissionsList
            targets={data.targets}
            annotations={data.annotations}
            chainId={mod.chainId}
          />
        </Box>
      </Flex>
    </main>
  );
}
