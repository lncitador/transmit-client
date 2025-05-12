import { onBeforeUnmount, ref, reactive, watchEffect, Ref, UnwrapRef, inject } from 'vue'
import { TransmitProviderKey } from './plugin.js'

/**
 * Options for the useTransmit hook
 * @template T Type of data received from the channel
 */
export interface UseTransmitOptions<T> {
  /**
   * Callback executed when a message is received from the channel
   * @param data The message data
   */
  onMessage?: (data: T) => void

  /**
   * Callback executed when an error occurs during subscription or message handling
   * @param error The error that occurred
   */
  onError?: (error: unknown) => void

  /**
   * Whether the subscription should be active
   * @default true
   */
  enabled?: boolean
}

export type UseTransmitEvent<T> = {
  /**
   * The type of event
   * @type {string}
   * @description The type of event, e.g., 'message', 'error', etc.
   * This is used to identify the kind of event that occurred
   */
  type: string

  /**
   * The data associated with the event
   * @type {T}
   * @description The data received from the channel
   * This is the actual message or payload sent by the server
   */
  data: T

  /**
   * The timestamp when the event occurred
   * @type {Date}
   * @description The date and time when the event was received
   * This is useful for tracking when messages were sent or received
   */
  timestamp: Date
}

export type UseTransmitData<T> = UnwrapRef<{
  /**
   * The most recently received message
   * @type {T | null}
   * @default null
   * @description The last message received from the channel
   * This is reactive and will update when a new message is received
   */
  lastMessage: T | null

  /**
   * Array of all received messages with metadata
   * @type {Array<UseTransmitEvent<T>>}
   * @description An array of objects containing the type, data, and timestamp of each message
   */
  events: Array<UseTransmitEvent<T>>
}>

export interface UseTransmitReturn<T> {
  isConnected: Ref<boolean>
  error: Ref<unknown>
  data: UseTransmitData<T>
  close: () => void
  reconnect: () => void
}

/**
 * Vue composable for subscribing to an AdonisJS Transmit channel
 *
 * This composable creates and manages a subscription to a real-time channel using the
 * AdonisJS Transmit client. It handles connection state, error handling, and message processing.
 *
 * @template T Type of data received from the channel
 * @param {string} channel The name of the channel to subscribe to
 * @param {UseTransmitOptions<T>} options Configuration options for the subscription
 * @returns {UseTransmitReturn<T>} An object containing connection state, error information, received data, and control methods
 *
 * @example
 * ```vue
 * <script setup>
 * import { useTransmit } from '@adonisjs/transmit-client/use/vue'
 *
 * const { isConnected, error, data, close, reconnect } = useTransmit('chat-room', {
 *   enabled: true,
 *   onMessage: (message) => {
 *     console.log('New message:', message)
 *   },
 *   onError: (err) => {
 *     console.error('Subscription error:', err)
 *   }
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <div v-if="isConnected">Connected to channel</div>
 *     <div v-else>Disconnected</div>
 *
 *     <div v-if="error">Error: {{ error }}</div>
 *
 *     <div v-if="data.lastMessage">
 *       Latest message: {{ data.lastMessage }}
 *     </div>
 *
 *     <button @click="reconnect">Reconnect</button>
 *     <button @click="close">Disconnect</button>
 *   </div>
 * </template>
 * ```
 */
export function useTransmit<T>(
  channel: string,
  options: UseTransmitOptions<T> = {}
): UseTransmitReturn<T> {
  const transmit = inject(TransmitProviderKey)

  if (!transmit) {
    throw new Error('Configure TransmitPlugin before using useTransmit')
  }

  const { enabled = true, onMessage, onError } = options
  const enabledWithClient = typeof window !== 'undefined' && enabled

  const isConnected = ref(false)
  const error = ref<unknown>(null)

  const data = reactive({
    lastMessage: null as T | null,
    events: [] as Array<UseTransmitEvent<T>>,
  })

  if (typeof window === 'undefined') {
    return { isConnected, error, data, close: () => {}, reconnect: () => {} }
  }

  let subscription = transmit.subscription(channel)
  let isSubscribed = false

  const connect = async () => {
    if (!enabledWithClient || isSubscribed) return

    try {
      await subscription.create()
      isConnected.value = true
      isSubscribed = true

      subscription.onMessage((message: any) => {
        data.lastMessage = message
        data.events.push({ type: 'message', data: message, timestamp: new Date() })
        onMessage?.(message)
      })
    } catch (err) {
      error.value = err
      onError?.(err)
    }
  }

  /**
   * Closes the current subscription if it exists
   */
  const close = () => {
    if (subscription?.isCreated) {
      subscription.delete()
      isConnected.value = false
      isSubscribed = false
    }
  }

  /**
   * Closes the current subscription and creates a new one
   */
  const reconnect = () => {
    close()
    connect()
  }

  // Watch for changes to the enabled state
  watchEffect(() => {
    if (enabledWithClient && !isConnected.value) {
      connect()
    } else if (!enabledWithClient && isConnected.value) {
      close()
    }
  })

  // Clean up subscription when component is unmounted
  onBeforeUnmount(close)

  return {
    isConnected,
    error,
    data,
    close,
    reconnect,
  }
}
