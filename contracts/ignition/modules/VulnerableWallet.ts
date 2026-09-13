import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VulnerableWalletModule = buildModule("VulnerableWalletModule", (m) => {
  const wallet = m.contract("VulnerableWallet");

  return { wallet };
});

export default VulnerableWalletModule;
