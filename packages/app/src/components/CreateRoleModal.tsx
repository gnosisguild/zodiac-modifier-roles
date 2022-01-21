import React, { useState } from "react"
import { makeStyles } from "@material-ui/core"
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk"
import { RolesModifier__factory } from "../contracts/type"
import { Transaction as SafeTransaction } from "@gnosis.pm/safe-apps-sdk"
import { GenericModal, Loader, ModalFooterConfirmation, TextFieldInput } from "@gnosis.pm/safe-react-components"
import { useWallet } from "../hooks/useWallet"
import { PopulatedTransaction } from "ethers"

type Props = {
  onClose: () => void
}

const useStyles = makeStyles((theme) => ({}))

const CreateRoleModal = ({ onClose }: Props): React.ReactElement => {
  const classes = useStyles()
  const [targetAddress, setTargetAddress] = useState<string>("")
  const [isWaiting, setIsWaiting] = useState<boolean>(false)
  const { sdk, connected, safe } = useSafeAppsSDK()
  const { provider, onboard } = useWallet()
  const rolesModifierAddress = "0x233E94a1b2CCf51C6AF4D39ba43b128EA84E39b2" // TODO: should not be hardcoded

  const onSubmit = async () => {
    console.log("Adding target to role", targetAddress)
    if (!provider) {
      throw Error("No provider")
      return
    }
    const txs: PopulatedTransaction[] = []

    const signer = await provider.getSigner()
    const RolesModifier = RolesModifier__factory.connect(rolesModifierAddress, signer)

    txs.push(await RolesModifier.populateTransaction.allowTarget("1", targetAddress, "3"))

    await sdk.txs.send({ txs: txs.map(convertTxToSafeTx) })

    onClose()
    console.log("Transaction initiated")
  }

  function convertTxToSafeTx(tx: PopulatedTransaction): SafeTransaction {
    return {
      to: tx.to as string,
      value: "0",
      data: tx.data as string,
    }
  }

  return (
    <GenericModal
      onClose={onClose}
      title="Create a new role"
      body={
        <form noValidate autoComplete="off" onSubmit={onSubmit}>
          <TextFieldInput
            id="standard-TextFieldInput"
            label="TextFieldInput"
            name="TextFieldInput"
            placeholder="TextFieldInput with default values"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
          />
        </form>
      }
      footer={
        isWaiting ? (
          <Loader size="md" />
        ) : (
          <ModalFooterConfirmation
            okText="Create Role"
            cancelText="Cancel"
            handleCancel={onClose}
            handleOk={onSubmit}
          />
        )
      }
    />
  )
}

export default CreateRoleModal
