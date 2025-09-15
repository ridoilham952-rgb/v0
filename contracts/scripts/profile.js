const hre = require("hardhat")

async function main() {
  console.log("Running gas profiling...")

  const [deployer] = await hre.ethers.getSigners()

  // Deploy contracts
  const SampleERC20 = await hre.ethers.getContractFactory("SampleERC20")
  const token = await SampleERC20.deploy("Test Token", "TT", 1000000)
  await token.waitForDeployment()

  const MiniDEX = await hre.ethers.getContractFactory("MiniDEX")
  const dex = await MiniDEX.deploy()
  await dex.waitForDeployment()

  console.log("Profiling contract functions...")

  const profileResults = []

  // Profile token operations
  const mintTx = await token.mint(deployer.address, 1000)
  const mintReceipt = await mintTx.wait()
  profileResults.push({
    function: "SampleERC20.mint",
    gasUsed: mintReceipt.gasUsed.toString(),
    contract: await token.getAddress(),
  })

  const expensiveTx = await token.expensiveOperation(100)
  const expensiveReceipt = await expensiveTx.wait()
  profileResults.push({
    function: "SampleERC20.expensiveOperation",
    gasUsed: expensiveReceipt.gasUsed.toString(),
    contract: await token.getAddress(),
  })

  // Profile DEX operations
  await token.approve(await dex.getAddress(), 10000)
  const addLiqTx = await dex.addLiquidity(
    await token.getAddress(),
    "0x0000000000000000000000000000000000000001", // Mock token
    1000,
    1000,
  )
  const addLiqReceipt = await addLiqTx.wait()
  profileResults.push({
    function: "MiniDEX.addLiquidity",
    gasUsed: addLiqReceipt.gasUsed.toString(),
    contract: await dex.getAddress(),
  })

  console.log("Gas Profile Results:", JSON.stringify(profileResults, null, 2))
  return profileResults
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
