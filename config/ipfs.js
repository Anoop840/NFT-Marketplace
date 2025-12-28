let ipfsClient;

async function initializeIpfs() {
  if (!ipfsClient) {
    const { create: createIpfs } = await import("ipfs-http-client");
    const auth =
      "Basic " +
      Buffer.from(
        process.env.IPFS_PROJECT_ID + ":" + process.env.IPFS_PROJECT_SECRET
      ).toString("base64");

    ipfsClient = createIpfs({
      host: process.env.IPFS_HOST,
      port: process.env.IPFS_PORT,
      protocol: "https",
      headers: {
        authorization: auth,
      },
    });
  }
  return ipfsClient;
}

module.exports = { initializeIpfs };
