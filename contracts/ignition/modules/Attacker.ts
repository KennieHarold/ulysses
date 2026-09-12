import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AttackerModule = buildModule("AttackerModule", (m) => {
  const vaultAddress = m.getParameter<string>("vaultAddress");

  const attacker = m.contract("Attacker", [vaultAddress]);

  return { attacker };
});

export default AttackerModule;
