import type { UseTransmitData, UseTransmitEvent, UseTransmitOptions } from '../types.js'
import * as React from 'react'
import { TransmitContext } from './context.jsx'

export interface UseTransmitReturn<T> {
  isConnected: boolean
  error: unknown
  data: UseTransmitData<T>
  close: () => Promise<void>
  reconnect: () => Promise<void>
}

type Action<T> =
  | { type: 'ADD_EVENT'; payload: Omit<UseTransmitEvent<T>, 'timestamp'> }
  | { type: 'RESET' }

const reducer = <T>(state: UseTransmitData<T>, action: Action<T>): UseTransmitData<T> => {
  switch (action.type) {
    case 'ADD_EVENT':
      return {
        ...state,
        lastMessage: action.payload.data,
        events: [...state.events, { ...action.payload, timestamp: new Date() }],
      }
    case 'RESET':
      return { lastMessage: null, events: [] }
    default:
      return state
  }
}

export function useTransmit<T>(
  channel: string,
  options: UseTransmitOptions<T> = {}
): UseTransmitReturn<T> {
  const transmit = React.useContext(TransmitContext)

  if (!transmit) {
    throw new Error(
      'TransmitContext not found. Make sure your component is wrapped with TransmitProvider.'
    )
  }

  const { enabled = true, onMessage, onError } = options
  const enabledWithClient = typeof window !== 'undefined' && enabled
  const [isConnected, setIsConnected] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const [data, dispatch] = React.useReducer(reducer<T>, {
    lastMessage: null,
    events: [],
  })

  // Early return for SSR
  if (typeof window === 'undefined') {
    return {
      isConnected: false,
      error,
      data,
      close: async () => {},
      reconnect: async () => {},
    }
  }

  const subscription = transmit.subscription(channel)

  const connect = React.useCallback(async () => {
    if (!enabledWithClient || !subscription) return

    try {
      await subscription.create()
      setIsConnected(true)

      subscription.onMessage((message: any) => {
        dispatch({ type: 'ADD_EVENT', payload: { type: 'message', data: message } })
        onMessage?.(message)
      })
    } catch (err) {
      setError(err)
      onError?.(err)
    }
  }, [enabledWithClient, subscription, onMessage, onError])

  const close = React.useCallback(async () => {
    if (subscription?.isCreated) {
      await subscription.delete()
      setIsConnected(false)
    }
  }, [subscription])

  const reconnect = React.useCallback(async () => {
    await close()
    dispatch({ type: 'RESET' })
    await connect()
  }, [close, connect])

  React.useEffect(() => {
    connect()
    return () => {
      void (async () => {
        await close()
      })()
    }
  }, [connect, close])

  return {
    isConnected,
    error,
    data,
    close,
    reconnect,
  }
}
