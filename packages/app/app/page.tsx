"use client";
import { isAddress } from "viem";
import { useState } from "react";
import styles from "./page.module.css";
import Box from "@/ui/Box";
import Flex from "@/ui/Flex";
import Button from "@/ui/Button";
import Field from "@/ui/Field";
import ChainSelect from "@/components/ChainSelect";
import { CHAINS, ChainId, DEFAULT_CHAIN } from "@/app/chains";
import { useRouter } from "next/navigation";

const chains = Object.values(CHAINS);

export default function AttachMod() {
  const router = useRouter();
  const [chainId, setChainId] = useState<ChainId>(DEFAULT_CHAIN.id);
  const [address, setAddress] = useState("");
  return (
    <main className={styles.main}>
      <Flex gap={0} justifyContent="center" alignItems="center">
        <Box bg p={3}>
          <Flex direction="column" gap={3}>
            <h3>Connect a Roles Mod</h3>
            <p>
              Once a Roles Mod is connected you can manage roles and
              permissions.
            </p>
            <Field label="Chain">
              <ChainSelect
                value={chainId}
                onChange={(nextChainId) => {
                  setChainId(nextChainId);
                  setAddress(
                    CHAINS[nextChainId].prefix + ":" + unprefix(address)
                  );
                }}
              />
            </Field>
            <Field label="Roles Mod Address">
              <input
                type="text"
                placeholder={DEFAULT_CHAIN.prefix + ":0x..."}
                spellCheck="false"
                value={address}
                onFocus={(ev) =>
                  ev.target.setSelectionRange(0, ev.target.value.length)
                }
                onChange={(ev) => {
                  const { value } = ev.target;
                  if (value.indexOf(":") > 0) {
                    const [chainPrefix] = value.split(":");
                    const nextChainId =
                      chains.find((chain) => chain.prefix === chainPrefix)
                        ?.id || chainId;
                    setChainId(nextChainId);
                  }
                  setAddress(value);
                }}
              />
            </Field>
            <Button
              disabled={!isAddress(unprefix(address))}
              onClick={() => router.push("/" + address)}
            >
              Attach
            </Button>
          </Flex>
        </Box>
      </Flex>
    </main>
  );
}

const unprefix = (value: string) => {
  if (value.indexOf(":") > 0) {
    const [, address] = value.split(":");
    return address;
  } else {
    return value;
  }
};
