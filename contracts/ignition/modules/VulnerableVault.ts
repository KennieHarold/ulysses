import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VulnerableVaultModule = buildModule("VulnerableVaultModule", (m) => {
  const vault = m.contract("VulnerableVault");

  return { vault };
});

export default VulnerableVaultModule;
