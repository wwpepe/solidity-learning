import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
export default buildModule("MyTokenDeploy", (m) => {
  const myTokenC = m.contract("MyToken", ["MyToken", "MT", 18, 10000000n]);
  const tinyBankC = m.contract("TinyBank", [myTokenC]);
  return { myTokenC, tinyBankC };
});
