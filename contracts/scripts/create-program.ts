import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function deployedAddresses(): Record<string, string> {
  const chainId = network.config.chainId;
  const file = path.join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    `chain-${chainId}`,
    "deployed_addresses.json",
  );
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
}

function resolveEscrowAddress(address: Record<string, string>): string {
  const override = process.env.ESCROW_ADDRESS;
  if (override && override.length > 0) return override;
  const escrow = address["BountyEscrowModule#BountyEscrow"];
  if (!escrow) {
    throw new Error(
      "No ESCROW_ADDRESS set and no BountyEscrowModule#BountyEscrow in deployed_addresses.json.",
    );
  }
  return escrow;
}

function resolveTargetAddress(address: Record<string, string>): string {
  const override = process.env.TARGET_ADDRESS;
  if (override && override.length > 0) return override;
  const vault = address["VulnerableVaultModule#VulnerableVault"];
  if (!vault) {
    throw new Error(
      "No TARGET_ADDRESS set and no VulnerableVaultModule#VulnerableVault in deployed_addresses.json.",
    );
  }
  return vault;
}

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  if (!signer) throw new Error("No signer available — set PRIVATE_KEY in contracts/.env.");

  const address = deployedAddresses();
  const escrowAddress = resolveEscrowAddress(address);
  const targetAddress = resolveTargetAddress(address);

  const rewards = [
    0n,
    ethers.parseEther(process.env.REWARD_LOW ?? "0.1"),
    ethers.parseEther(process.env.REWARD_MEDIUM ?? "0.5"),
    ethers.parseEther(process.env.REWARD_HIGH ?? "2"),
    ethers.parseEther(process.env.REWARD_CRITICAL ?? "10"),
  ] as const;

  const fundingEth = process.env.FUNDING_ETH ?? "12";
  const funding = ethers.parseEther(fundingEth);

  const escrow = await ethers.getContractAt("BountyEscrow", escrowAddress, signer);

  console.log(`Network:  ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Sponsor:  ${signer.address}`);
  console.log(`Escrow:   ${escrowAddress}`);
  console.log(`Target:   ${targetAddress}`);
  console.log(`Funding:  ${fundingEth} ETH`);
  console.log(
    `Rewards:  LOW ${ethers.formatEther(rewards[1])} / MEDIUM ${ethers.formatEther(rewards[2])} / ` +
      `HIGH ${ethers.formatEther(rewards[3])} / CRITICAL ${ethers.formatEther(rewards[4])} ETH`,
  );

  const tx = await escrow.createProgram(targetAddress, rewards, { value: funding });
  console.log(`\ncreateProgram tx: ${tx.hash}`);
  const receipt = await tx.wait();

  const nextId = await escrow.nextProgramId();
  console.log(`Mined in block ${receipt?.blockNumber}. programId = ${nextId - 1n}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
