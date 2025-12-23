// services/blockchainService.js
const { ethers } = require("ethers");
const { getProvider, getNFTContract } = require("../config/blockchain");
const NFT = require("../models/NFT");
const Transaction = require("../models/Transaction");

class BlockchainService {
  async monitorTransaction(txHash, chain = "polygon") {
    const provider = getProvider(chain);

    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error("Transaction not found");
      }

      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        success: receipt.status === 1,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        from: tx.from,
        to: tx.to,
      };
    } catch (error) {
      console.error("Monitor transaction error:", error);
      throw error;
    }
  }

  async getNFTMetadata(contractAddress, tokenId, chain = "polygon") {
    try {
      const contract = getNFTContract(contractAddress, chain);
      const tokenURI = await contract.tokenURI(tokenId);

      // Fetch metadata from URI
      let metadata;
      if (tokenURI.startsWith("ipfs://")) {
        const ipfsHash = tokenURI.replace("ipfs://", "");
        const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
        metadata = await response.json();
      } else {
        const response = await fetch(tokenURI);
        metadata = await response.json();
      }

      return metadata;
    } catch (error) {
      console.error("Get NFT metadata error:", error);
      throw error;
    }
  }

  async verifyOwnership(
    contractAddress,
    tokenId,
    walletAddress,
    chain = "polygon"
  ) {
    try {
      const contract = getNFTContract(contractAddress, chain);
      const owner = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error("Verify ownership error:", error);
      return false;
    }
  }

  async indexNFTTransfer(event, chain = "polygon") {
    const { from, to, tokenId } = event.args;
    const txHash = event.transactionHash;
    const contractAddress = event.address;

    try {
      // Update NFT owner
      await NFT.findOneAndUpdate(
        {
          contractAddress: contractAddress.toLowerCase(),
          tokenId: tokenId.toString(),
        },
        { owner: to.toLowerCase(), updatedAt: Date.now() },
        { new: true, upsert: false }
      );

      // Record transaction
      const tx = await Transaction.findOne({ transactionHash: txHash });
      if (!tx) {
        await Transaction.create({
          transactionHash: txHash,
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          tokenId: tokenId.toString(),
          contractAddress: contractAddress.toLowerCase(),
          type: "transfer",
          status: "confirmed",
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error("Index NFT transfer error:", error);
    }
  }

  async listenToContractEvents(contractAddress, chain = "polygon") {
    const contract = getNFTContract(contractAddress, chain);

    contract.on("Transfer", async (from, to, tokenId, event) => {
      await this.indexNFTTransfer(event, chain);
    });

    console.log(
      `Listening to Transfer events for ${contractAddress} on ${chain}`
    );
  }
}

module.exports = new BlockchainService();
