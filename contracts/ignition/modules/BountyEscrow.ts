import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BountyEscrowModule = buildModule("BountyEscrowModule", (m) => {
  const attestor = m.getParameter<string>("attestor");
  const escrow = m.contract("BountyEscrow", [attestor]);
  return { escrow };
});

export default BountyEscrowModule;
