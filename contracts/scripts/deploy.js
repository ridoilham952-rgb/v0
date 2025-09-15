const hre = require("hardhat")

async function main() {
  console.log("Deploying contracts to Somnia...")

  // Deploy SampleERC20
  const SampleERC20 = await hre.ethers.getContractFactory("SampleERC20")
  const token = await SampleERC20.deploy("Somnia Test Token", "STT", 1000000)
  await token.waitForDeployment()

  console.log("SampleERC20 deployed to:", await token.getAddress())

  // Deploy MiniDEX
  const MiniDEX = await hre.ethers.getContractFactory("MiniDEX")
  const dex = await MiniDEX.deploy()
  await dex.waitForDeployment()

  console.log("MiniDEX deployed to:", await dex.getAddress())

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    token: await token.getAddress(),
    dex: await dex.getAddress(),
    timestamp: new Date().toISOString(),
  }

  console.log("Deployment complete:", deploymentInfo)
  return deploymentInfo
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
