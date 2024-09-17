"use client"
import { useState } from "react"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  Annotation,
  Target,
  checkIntegrity,
  processPermissions,
} from "zodiac-roles-sdk"
import styles from "./page.module.css"
import Box from "@/ui/Box"
import Flex from "@/ui/Flex"
import Button from "@/ui/Button"
import Layout from "@/components/Layout"
import {
  zAnnotation,
  zPermission,
  zTarget,
} from "@/components/permissions/schema"
import ChainSelect from "@/components/ChainSelect"
import { ChainId, DEFAULT_CHAIN, CHAINS } from "../chains"

export default function PermissionsPage() {
  const [chainId, setChainId] = useState<ChainId>(DEFAULT_CHAIN.id)
  const [value, setValue] = useState("")
  const [submitPending, setSubmitPending] = useState(false)
  const router = useRouter()
  console.log(
    JSON.stringify(
      processPermissions([
        {
          targetAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
          selector: "0x095ea7b3",
          condition: {
            paramType: 5,
            operator: 5,
            children: [
              {
                paramType: 1,
                operator: 16,
                compValue:
                  "0x000000000000000000000000c92e8bdf79f0507f65a392b0ab4667716bfe0110",
              },
              {
                paramType: 1,
                operator: 0,
              },
            ],
          },
        },
        {
          targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
          selector: "0x569d3489",
          condition: {
            paramType: 5,
            operator: 5,
            children: [
              {
                paramType: 3,
                operator: 5,
                children: [
                  {
                    paramType: 1,
                    operator: 16,
                    compValue:
                      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                  },
                  {
                    paramType: 1,
                    operator: 16,
                    compValue:
                      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                  },
                  {
                    paramType: 1,
                    operator: 15,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                ],
              },
              {
                paramType: 1,
                operator: 0,
              },
              {
                paramType: 1,
                operator: 0,
              },
            ],
          },
          delegatecall: true,
        },
        {
          targetAddress: "0x23da9ade38e4477b23770ded512fd37b12381fab",
          selector: "0x5a66c223",
          condition: {
            paramType: 5,
            operator: 5,
            children: [
              {
                paramType: 3,
                operator: 5,
                children: [
                  {
                    paramType: 1,
                    operator: 16,
                    compValue:
                      "0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f",
                  },
                  {
                    paramType: 1,
                    operator: 16,
                    compValue:
                      "0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
                  },
                  {
                    paramType: 1,
                    operator: 15,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                  {
                    paramType: 1,
                    operator: 0,
                  },
                ],
              },
            ],
          },
          delegatecall: true,
        },
      ]).targets
    )
  )
  let errorMessage = ""
  let json = null
  if (value.trim()) {
    try {
      json = JSON.parse(value)
    } catch (e) {
      console.error(e)
      errorMessage = "Invalid json input"
    }
  }

  let targets: Target[] | null = null
  let annotations: Annotation[] = []
  if (json) {
    try {
      // {targets: [...], annotations: [...]}
      ;({ targets, annotations } = z
        .object({
          targets: z.array(zTarget),
          annotations: z.array(zAnnotation),
        })
        .parse(json))
    } catch (e) {
      try {
        // [...targets]
        targets = z.array(zTarget).parse(json)
      } catch (eT) {
        try {
          // [...permissions]
          const permissions = z.array(zPermission).parse(json)
          const result = processPermissions(permissions)
          targets = result.targets
          annotations = result.annotations
        } catch (eP) {
          console.error(
            "not parsable as `{targets: [...], annotations: [...]}`",
            e
          )
          console.error("not parsable as `[...targets]`", eT)
          console.error("not parsable as `[...permissions]`", eP)
          errorMessage =
            "Json input is neither a valid set of targets nor a valid permissions array"
        }
      }
    }
  }

  if (targets) {
    try {
      checkIntegrity(targets)
    } catch (e) {
      errorMessage =
        e instanceof Error
          ? e.message
          : "Invalid targets (integrity check failed)"
    }
  }

  const submit = async () => {
    setSubmitPending(true)
    const res = await fetch("/api/permissions", {
      method: "POST",
      body: JSON.stringify({ targets, annotations }),
    })
    const { hash } = await res.json()
    if (hash) {
      router.push(`/permissions/${CHAINS[chainId].prefix}/${hash}`)
    } else {
      setSubmitPending(false)
    }
  }

  return (
    <Layout noScroll>
      <main className={styles.main}>
        <Box bg p={3} className={styles.box}>
          <Flex direction="column" gap={3} className={styles.flex}>
            <ChainSelect
              value={chainId}
              onChange={(nextChainId) => {
                setChainId(nextChainId)
              }}
            />
            <textarea
              autoFocus
              className={styles.textarea}
              value={value}
              onChange={(ev) => setValue(ev.target.value)}
              placeholder="Paste permissions JSON here"
            />
            {errorMessage && <Box p={3}>{errorMessage}</Box>}
            <Button
              disabled={!value.trim() || !!errorMessage || submitPending}
              onClick={submit}
            >
              {submitPending ? "Submitting..." : "Submit"}
            </Button>
          </Flex>
        </Box>
      </main>
    </Layout>
  )
}
