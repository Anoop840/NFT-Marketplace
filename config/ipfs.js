const { create } = require("ipfs-http-client");

const auth =
  "Basic " +
  Buffer.from(
    process.env.IPFS_PROJECT_ID + ":" + process.env.IPFS_PROJECT_SECRET
  ).toString("base64");

const ipfsClient = create({
  host: process.env.IPFS_HOST,
  port: process.env.IPFS_PORT,
  protocol: process.env.IPFS_PROTOCOL,
  headers: {
    authorization: auth,
  },
});

const uploadToIPFS = async (file) => {
  try {
    const added = await ipfsClient.add(file);
    const url = `https://ipfs.io/ipfs/${added.path}`;
    return { path: added.path, url };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw error;
  }
};

const uploadJSONToIPFS = async (json) => {
  try {
    const data = JSON.stringify(json);
    const added = await ipfsClient.add(data);
    const url = `https://ipfs.io/ipfs/${added.path}`;
    return { path: added.path, url };
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw error;
  }
};

module.exports = { ipfsClient, uploadToIPFS, uploadJSONToIPFS };
