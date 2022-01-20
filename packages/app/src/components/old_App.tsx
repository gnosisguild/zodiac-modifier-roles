import React from "react";
import logo from "../assets/images/logo.svg";
import { useWallet } from "../hooks/useWallet";
// import { RolesModifier__factory } from "../../contracts/type";
// import { useRootSelector } from "../../store";
// import { getWalletAddress } from "../../store/main/selectors";

function ContractInteractions() {
  // const { provider } = useWallet();
  // const from = useRootSelector(getWalletAddress);

  // const handleAssignRole = async () => {
  //   if (!from || !provider) return;
  //   const signer = provider.getSigner();
  //   const rolesMod = RolesModifier__factory.connect(from, signer);
  //   rolesMod.assignRoles();
  // };

  return (
    <div style={{ marginTop: 24 }}>
      <button>Assign Role</button>
    </div>
  );
}

function App() {
  const { startOnboard, provider } = useWallet();
  const handleConnect = () => {
    startOnboard();
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={handleConnect}>Connect</button>
        {provider ? <ContractInteractions /> : null}
      </header>
    </div>
  );
}

export default App;
