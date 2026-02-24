import React, { useState, useEffect } from 'react'
import * as fcl from '@onflow/fcl'
import './App.css'
import WalletConnect from './components/WalletConnect'
import SwapInterface from './components/SwapInterface'
import PoolDashboard from './components/PoolDashboard'
import LiquidityProvider from './components/LiquidityProvider'

fcl.config()
  .put('accessNode.api', 'https://rest-testnet.onflow.org')
  .put('discovery.wallet', 'https://fcl-discovery.onflow.org/testnet/authn')

const SWAP_ADDRESS = '0x791e03a1b0a978ff'

export default function App() {
  const [user, setUser] = useState(null)
  const [pools, setPools] = useState([])
  const [stats, setStats] = useState({ poolCount: 0, totalFees: 0, totalVolume: 0 })
  const [activeTab, setActiveTab] = useState('swap')

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  useEffect(() => {
    fetchPools()
    fetchStats()
    const interval = setInterval(() => {
      fetchPools()
      fetchStats()
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  const fetchPools = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import FlowSwap from ${SWAP_ADDRESS}
          
          pub fun main(): [String] {
            return FlowSwap.getAllPools()
          }
        `
      })
      setPools(response || [])
    } catch (error) {
      console.error('Error fetching pools:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fcl.query({
        cadence: `
          import FlowSwap from ${SWAP_ADDRESS}
          
          pub fun main(): {String: AnyStruct} {
            return FlowSwap.getStats()
          }
        `
      })
      setStats(response || {})
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>FlowSwap</h1>
          <p className="subtitle">Decentralized Exchange (DEX) for Flow</p>
          <WalletConnect user={user} />
        </div>
      </header>

      <main className="container">
        <div className="swap-stats">
          <div className="stat-card">
            <h3>Liquidity Pools</h3>
            <p className="stat-value">{stats.poolCount || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Volume</h3>
            <p className="stat-value">{(stats.totalVolume || 0).toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Fees Collected</h3>
            <p className="stat-value">{(stats.totalFees || 0).toFixed(4)}</p>
          </div>
        </div>

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </button>
          <button 
            className={`tab ${activeTab === 'liquidity' ? 'active' : ''}`}
            onClick={() => setActiveTab('liquidity')}
          >
            Liquidity
          </button>
          <button 
            className={`tab ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
          >
            Pools
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'swap' && (
            <SwapInterface 
              user={user} 
              pools={pools}
              swapAddress={SWAP_ADDRESS}
              onSwapComplete={fetchStats}
            />
          )}
          {activeTab === 'liquidity' && (
            <LiquidityProvider 
              user={user}
              pools={pools}
              swapAddress={SWAP_ADDRESS}
              onLiquidityUpdate={fetchStats}
            />
          )}
          {activeTab === 'pools' && (
            <PoolDashboard pools={pools} swapAddress={SWAP_ADDRESS} />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>FlowSwap — Decentralized Exchange | Testnet Beta</p>
      </footer>
    </div>
  )
}
