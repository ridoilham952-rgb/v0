// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MiniDEX is ReentrancyGuard {
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 timestamp
    );
    
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 timestamp
    );
    
    mapping(address => mapping(address => uint256)) public liquidity;
    mapping(address => uint256) public totalLiquidity;
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        require(tokenA != tokenB, "Same token");
        require(amountA > 0 && amountB > 0, "Invalid amounts");
        
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        liquidity[tokenA][tokenB] += amountA;
        liquidity[tokenB][tokenA] += amountB;
        totalLiquidity[tokenA] += amountA;
        totalLiquidity[tokenB] += amountB;
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, block.timestamp);
    }
    
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external nonReentrant {
        require(tokenIn != tokenOut, "Same token");
        require(amountIn > 0, "Invalid amount");
        require(liquidity[tokenIn][tokenOut] > 0, "No liquidity");
        
        // Simple constant product formula (x * y = k)
        uint256 amountOut = (amountIn * liquidity[tokenOut][tokenIn]) / 
                           (liquidity[tokenIn][tokenOut] + amountIn);
        
        require(amountOut > 0, "Insufficient output");
        require(liquidity[tokenOut][tokenIn] >= amountOut, "Insufficient liquidity");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        liquidity[tokenIn][tokenOut] += amountIn;
        liquidity[tokenOut][tokenIn] -= amountOut;
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, block.timestamp);
    }
    
    // Gas-intensive function for profiling
    function complexCalculation(uint256 complexity) external view returns (uint256) {
        uint256 result = 0;
        for (uint256 i = 0; i < complexity; i++) {
            result += i * complexity / (i + 1);
        }
        return result;
    }
}
