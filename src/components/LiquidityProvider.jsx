import React, { useState } from 'react'
import * as fcl from '@onflow/fcl'

export default function LiquidityProvider({ user, pools, swapAddress, onLiquidityUpdate }) {
  const [selectedPool, setSelectedPool] = useState(pools[0] || '')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [minLPTokens, setMinLPTokens] = useState('0')
  const [lpTokens, setLpTokens] = useState('')
  const [minAmountA, setMinAmountA] = useState('0')
  const [minAmountB, setMinAmountB] = useState('0')
  const [action, setAction] = useState('add')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addLiquidity = async () => {
    if (!user?.addr) {
      setMessage('Please connect wallet')
      return
    }

    setLoading(true)
    try {
      const txId = await fcl.mutate({
        cadence: `
          import FlowSwap from ${swapAddress}
          
          transaction(poolId: String, amountA: UFix64, amountB: UFix64, minLPTokens: UFix64) {
            execute {
              let poolRef = FlowSwap.getPool(poolId: poolId) ?? panic("Pool not found")
              let lpTokens = poolRef.addLiquidity(amountA: amountA, amountB: amountB)
              
              assert(lpTokens >= minLPTokens, message: "Insufficient LP tokens")
            }
          }
        `,
        args: (arg, t) => [
          arg(selectedPool, t.String),
          arg(amountA, t.UFix64),
          arg(amountB, t.UFix64),
          arg(minLPTokens, t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      })

      setMessage(`Liquidity added! TX: ${txId}`)
      setAmountA('')
      setAmountB('')
      onLiquidityUpdate()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const removeLiquidity = async () => {
    if (!user?.addr) {
      setMessage('Please connect wallet')
      return
    }

    setLoading(true)
    try {
      const txId = await fcl.mutate({
        cadence: `
          import FlowSwap from ${swapAddress}
          
          transaction(poolId: String, lpTokens: UFix64, minAmountA: UFix64, minAmountB: UFix64) {
            execute {
              let poolRef = FlowSwap.getPool(poolId: poolId) ?? panic("Pool not found")
              let (amountA, amountB) = poolRef.removeLiquidity(lpTokens: lpTokens)
              
              assert(amountA >= minAmountA && amountB >= minAmountB, message: "Insufficient amounts")
            }
          }
        `,
        args: (arg, t) => [
          arg(selectedPool, t.String),
          arg(lpTokens, t.UFix64),
          arg(minAmountA, t.UFix64),
          arg(minAmountB, t.UFix64)
        ],
        payer: fcl.authz,
        proposer: fcl.authz,
        authorizations: [fcl.authz],
        limit: 100
      })

      setMessage(`Liquidity removed! TX: ${txId}`)
      setLpTokens('')
      onLiquidityUpdate()
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="liquidity-provider">
      <div className="action-tabs">
        <button 
          className={`action-tab ${action === 'add' ? 'active' : ''}`}
          onClick={() => setAction('add')}
        >
          Add Liquidity
        </button>
        <button 
          className={`action-tab ${action === 'remove' ? 'active' : ''}`}
          onClick={() => setAction('remove')}
        >
          Remove Liquidity
        </button>
      </div>

      {action === 'add' ? (
        <>
          <div className="form-group">
            <label>Pool</label>
            <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} className="form-select">
              <option value="">Select Pool</option>
              {pools.map(pool => (
                <option key={pool} value={pool}>{pool}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Amount A</label>
            <input
              type="number"
              placeholder="0.0"
              value={amountA}
              onChange={(e) => setAmountA(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Amount B</label>
            <input
              type="number"
              placeholder="0.0"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              className="form-input"
            />
          </div>

          <button 
            onClick={addLiquidity}
            disabled={!amountA || !amountB || loading || !user?.addr}
            className="submit-btn"
          >
            {loading ? 'Adding...' : 'Add Liquidity'}
          </button>
        </>
      ) : (
        <>
          <div className="form-group">
            <label>Pool</label>
            <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)} className="form-select">
              <option value="">Select Pool</option>
              {pools.map(pool => (
                <option key={pool} value={pool}>{pool}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>LP Tokens to Burn</label>
            <input
              type="number"
              placeholder="0.0"
              value={lpTokens}
              onChange={(e) => setLpTokens(e.target.value)}
              className="form-input"
            />
          </div>

          <button 
            onClick={removeLiquidity}
            disabled={!lpTokens || loading || !user?.addr}
            className="submit-btn"
          >
            {loading ? 'Removing...' : 'Remove Liquidity'}
          </button>
        </>
      )}

      {message && <p className="message">{message}</p>}
    </div>
  )
}
