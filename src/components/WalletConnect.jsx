import React from 'react'
import * as fcl from '@onflow/fcl'

export default function WalletConnect({ user }) {
  return (
    <div className="wallet-connect">
      {user?.addr ? (
        <div className="user-info">
          <span className="address">{user.addr.substring(0, 6)}...{user.addr.slice(-4)}</span>
          <button onClick={() => fcl.unauthenticate()} className="logout-btn">Disconnect</button>
        </div>
      ) : (
        <button onClick={() => fcl.authenticate()} className="connect-btn">
          Connect Wallet
        </button>
      )}
    </div>
  )
}
