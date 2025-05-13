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

export type UseTransmitData<T> = {
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
}
