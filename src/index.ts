import express from "express";
import { readFileSync } from "fs";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import {} from "keccak256";
import { keccak256 } from "ethers/lib/utils";

const app = express();
const PORT = 8000;
const DATA_HOME = process.env.DATA_HOME;

// Process whitelist
const whitelistMerkleData = processWhitelistMerkleData();
const whitelistMerkleTree = whitelistMerkleData.whitelistMerkleTree;

// Serve static files
app.use("/static", express.static("public"));
// Handle Index
app.get("/", (req, res) => res.send("Ethereum - The Merge NFT by Magic Dust"));
// Handle Generate Proof
app.get("/proof/:address/type/:nftType", handleGenerateProof);
// Start HTTP server
app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

function handleGenerateProof(req: any, res: any) {
  const address = req.params.address;
  const nftType = req.params.nftType;
  console.log(`generate proof requested for address: ${address} and NFT type: ${nftType}`);
  const proofData = {
    proof: generateProof(address, +nftType),
  };
  res.json(proofData);
}

function generateProof(address: string, nftType: number): string[] {
  const leafData = keccak256(generateLeafData(address, nftType));
  return whitelistMerkleTree.getHexProof(leafData);
}

function processWhitelistMerkleData(): any {
  const whitelistLeafData = [];
  const whitelistedAccounts = getWhitelist();
  for (const i in whitelistedAccounts) {
    const whitelistedAccount = whitelistedAccounts[i];
    whitelistLeafData.push(generateLeafData(whitelistedAccount.address, whitelistedAccount.nftType));
  }
  // Build leaf nodes from whitelisted addresses.
  const leafNodes = whitelistLeafData.map(addr => keccak256(addr));

  // Build the Merkle Tree.
  const whitelistMerkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  // Get the root hash of the Merkle Tree.
  const whitelistMerkleRootHash = ethers.utils.hexlify(whitelistMerkleTree.getRoot());

  return {
    whitelistMerkleTree,
    whitelistMerkleRootHash,
    leafNodes,
  };
}

function getWhitelist(): any {
  const whitelistData = readFileSync(`${DATA_HOME}/whitelist.json`).toString();
  return JSON.parse(whitelistData).whitelist;
}

function generateLeafData(address: string, nftType: number): string {
  return ethers.utils.hexConcat([address, toBytes32(nftType)]);
}

function toBytes32(value: number): string {
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(value), 32);
}