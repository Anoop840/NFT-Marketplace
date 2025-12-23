const { ethers } = require("ethers");

const providers = {
  ethereum: new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL),
  polygon: new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL),
  goerli: new ethers.JsonRpcProvider(process.env.GOERLI_RPC_URL),
};

const getProvider = (chain = "polygon") => {
  return providers[chain] || providers.polygon;
};

// NFT Contract ABI (simplified - add your full ABI)
const NFT_ABI = [
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function transferFrom(address from, address to, uint256 tokenId) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

// Marketplace Contract ABI (simplified - add your full ABI)
const MARKETPLACE_ABI = [
  "function createListing(address nftContract, uint256 tokenId, uint256 price) public",
  "function buyNFT(address nftContract, uint256 tokenId) public payable",
  "function cancelListing(address nftContract, uint256 tokenId) public",
  "event NFTListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTSold(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 price)",
];

const getNFTContract = (contractAddress, chain = "polygon") => {
  const provider = getProvider(chain);
  return new ethers.Contract(contractAddress, NFT_ABI, provider);
};

const getMarketplaceContract = (chain = "polygon") => {
  const provider = getProvider(chain);
  const address = process.env.MARKETPLACE_CONTRACT_ADDRESS;
  return new ethers.Contract(address, MARKETPLACE_ABI, provider);
};

module.exports = {
  getProvider,
  getNFTContract,
  getMarketplaceContract,
  NFT_ABI,
  MARKETPLACE_ABI,
};
