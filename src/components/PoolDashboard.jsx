import React, { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'

export default function PoolDashboard({ pools, swapAddress }) {
  const [poolDetails, setPoolDetails] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pools.length > 0) {
      fetchPoolDetails()
    }
  }, [pools])

  const fetchPoolDetails = async () => {
    setLoading(true)
    const details = {}

    for (const poolId of pools) {
      try {
        const info = await fcl.query({
          cadence: `
            import FlowSwap from ${swapAddress}
            
            pub fun main(poolId: String): FlowSwap.PoolInfo? {
              let poolRef = FlowSwap.getPool(poolId: poolId)
              return poolRef?.getInfo()
            }
          `,
          args: (arg, t) => [arg(poolId, t.String)]
        })
        details[poolId] = info
      } catch (error) {
        console.error(`Error fetching details for ${poolId}:`, error)
      }
    }

    setPoolDetails(details)
    setLoading(false)
  }

  return (
    <div className="pool-dashboard">
      {loading ? (
        <p>Loading pools...</p>
      ) : pools.length === 0 ? (
        <p className="empty-state">No pools available. Create the first pool!</p>
      ) : (
        <div className="pools-grid">
          {pools.map(poolId => {
            const pool = poolDetails[poolId]
            return (
              <div key={poolId} className="pool-card">
                <h3>{pool?.tokenAName}/{pool?.tokenBName}</h3>
                
                <div className="pool-info">
                  <div className="info-row">
                    <span>Reserve A:</span>
                    <strong>{(pool?.reserveA || 0).toFixed(2)}</strong>
                  </div>
                  <div className="info-row">
                    <span>Reserve B:</span>
                    <strong>{(pool?.reserveB || 0).toFixed(2)}</strong>
                  </div>
                  <div className="info-row">
                    <span>LP Supply:</span>
                    <strong>{(pool?.lpSupply || 0).toFixed(2)}</strong>
                  </div>
                  <div className="info-row">
                    <span>Price (A/B):</span>
                    <strong>
                      {pool?.reserveB && pool?.reserveA 
                        ? (pool.reserveA / pool.reserveB).toFixed(8)
                        : '0'
                      }
                    </strong>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
