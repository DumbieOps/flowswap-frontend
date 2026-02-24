import React, { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

export default function SwapInterface({ user, pools, swapAddress, onSwapComplete }) {
  const [selectedPool, setSelectedPool] = useState(pools[0] || '')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('0')
  const [isAtoB, setIsAtoB] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [minAmountOut, setMinAmountOut] = useState('0')

  useEffect(() => {
    if (selectedPool && amountIn) {
      getQuote()
    }
  }, [selectedPool, amountIn, isAtoB])

  const getQuote = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import FlowSwap from ${swapAddress}
          
          pub fun main(poolId: String, amountIn: UFix64, isAtoB: Bool): UFix64 {
            let poolRef = FlowSwap.getPool(poolId: poolId) ?? panic("Pool not found")
            return poolRef.getAmountOut(amountIn: amountIn, isAtoB: isAtoB)
          }
        `,
        args: (arg, t) => [
          arg(selectedPool, t.String),
          arg(amountIn, t.UFix64),
          arg(isAtoB, t.Bool)
        ]
      })
      setAmountOut((response || 0).toFixed(8))
      setMinAmountOut(((response || 0) * 0.99).toFixed(8)) // 1% slippage
    } catch (error) {
      console.error('Error getting quote:', error)
    }
  }

  const executeSwap = async () => {
    if (!user?.addr) {
      setMessage('Please connect wallet')
      return
    }

    setLoading(true)
    try {
      const txId = await fcl.mutate({
        cadence: `
          import FlowSwap from ${swapAddress}
          
          transaction(poolId: String, amountIn: UFix64, isAtoB: Bool, minAmountOut: UFix64) {
            execute {
              let poolRef = FlowSwap.getPool(poolId: poolId) ?? panic("Pool not found")
              let amountOut = poolRef.swap(amountIn: amountIn, isAtoB: isAtoB)
              
              assert(amountOut >= minAmountOut, message: "Slippage exceeds limit")
            }
          }
        `,
        args: (arg, t) => [
          arg(selectedPool, t.String),
          arg(amountIn, t.UFix64),
          arg(isAtoB, t.Bool),
          arg(minAmountOut, t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      })

      setMessage(`Swap submitted! TX: ${txId}`)
      setAmountIn('')
      setAmountOut('0')
      onSwapComplete()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="swap-interface">
      <div className="form-group">
        <label>Pool</label>
        <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} className="form-select">
          <option value="">Select Pool</option>
          {pools.map(pool => (
            <option key={pool} value={pool}>{pool}</option>
          ))}
        </select>
      </div>

      <div className="swap-box">
        <div className="input-group">
          <label>You Pay</label>
          <input
            type="number"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            className="form-input"
          />
          <button 
            onClick={() => setIsAtoB(!isAtoB)}
            className="toggle-btn"
          >
            Switch
          </button>
        </div>

        <div className="input-group">
          <label>You Receive (estimated)</label>
          <input
            type="text"
            value={amountOut}
            readOnly
            className="form-input disabled"
          />
        </div>

        <div className="slippage-info">
          <small>Min output: {minAmountOut} (1% slippage)</small>
        </div>
      </div>

      <button 
        onClick={executeSwap}
        disabled={!amountIn || loading || !user?.addr}
        className="submit-btn"
      >
        {loading ? 'Swapping...' : user?.addr ? 'Swap' : 'Connect Wallet'}
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  )
}
