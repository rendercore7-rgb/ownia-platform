// Anchor 배포 스크립트
const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider: any) {
  anchor.setProvider(provider);
  console.log("OWNIA Token deployed successfully!");
};
