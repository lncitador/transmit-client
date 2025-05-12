import { App } from 'vue'
import { Transmit, TransmitOptions } from '../../transmit.js'

import { InjectionKey } from 'vue'

export const TransmitProviderKey: InjectionKey<Transmit> = Symbol('Transmit')

export const TransmitPlugin = {
  install(app: App, config: TransmitOptions) {
    const transmit = new Transmit(config)
    app.provide(TransmitProviderKey, transmit)
  },
}
