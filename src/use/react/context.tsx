import * as React from 'react'
import { Transmit } from '../../transmit.js'

export const TransmitContext = React.createContext<Transmit | null>(null)

export type TransmitProviderProps = {
  transmit: Transmit
  children: React.ReactNode
}

export const TransmitProvider: React.FC<TransmitProviderProps> = ({ transmit, children }) => {
  return <TransmitContext.Provider value={transmit}>{children}</TransmitContext.Provider>
}
