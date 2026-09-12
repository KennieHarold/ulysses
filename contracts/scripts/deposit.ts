import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

function resolveVaultAddress(): string {
  const override = process.env.VAULT_ADDRESS;
  if (override && override.length > 0) return override;

  const chainId = network.config.chainId;
  const file = path.join(
    __dirname,
    "..",
    "ignition",
    "deployments",
    `chain-${chainId}`,
    "deployed_addresses.json",
  );

  if (!fs.existsSync(file)) {
    throw new Error(
      `No VAULT_ADDRESS set and no Ignition deployment found at ${file}. ` +
        `Pass VAULT_ADDRESS=0x... or deploy the vault first.`,
    );
  }

  const addresses = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, string>;
  const vault = addresses["VulnerableVaultModule#VulnerableVault"];
  if (!vault) {
    throw new Error(
      `deployed_addresses.json has no "VulnerableVaultModule#VulnerableVault" entry; ` +
        `pass VAULT_ADDRESS=0x... explicitly.`,
    );
  }
  return vault;
}

async function main(): Promise<void> {
  const [signer] = await ethers.getSigners();
  if (!signer) {
    throw new Error(
      "No signer available — set PRIVATE_KEY in contracts/.env for this network.",
    );
  }

  const vaultAddress = resolveVaultAddress();
  const amountEth = process.env.DEPOSIT_ETH ?? "0.12";
  const amountWei = ethers.parseEther(amountEth);

  const vault = await ethers.getContractAt("VulnerableVault", vaultAddress, signer);

  const signerBalance = await ethers.provider.getBalance(signer.address);
  console.log(`Network:        ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Depositor:      ${signer.address}`);
  console.log(`Depositor bal:  ${ethers.formatEther(signerBalance)} ETH`);
  console.log(`Vault:          ${vaultAddress}`);
  console.log(`Deposit amount: ${amountEth} ETH`);

  if (signerBalance <= amountWei) {
    throw new Error(
      `Depositor balance (${ethers.formatEther(signerBalance)} ETH) is not enough ` +
        `to deposit ${amountEth} ETH plus gas.`,
    );
  }

  const vaultBefore = await vault.getBalance();
  console.log(`\nVault balance before: ${ethers.formatEther(vaultBefore)} ETH`);

  console.log("Sending deposit()...");
  const tx = await vault.deposit({ value: amountWei });
  console.log(`  tx hash: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`  mined in block ${receipt?.blockNumber}`);

  const vaultAfter = await vault.getBalance();
  const recorded = await vault.balances(signer.address);
  console.log(`\nVault balance after:  ${ethers.formatEther(vaultAfter)} ETH`);
  console.log(`Your recorded deposit: ${ethers.formatEther(recorded)} ETH`);
  console.log("\nDone. You can now simulate withdraw() with:");
  console.log(`  from = ${signer.address}`);
  console.log(`  to   = ${vaultAddress}`);
  console.log(`  calldata = 0x3ccfd60b  (withdraw())`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
