// global states, variables and configs

import { ref } from 'vue'
import { type Config } from '@/core/typedefs'
import { NetworkHub } from '@/core/network'

export const Network = new NetworkHub(<Config>{
  seed: 11111,
  num_nodes: 20,
  grid_size: 80,
  tx_range: 20
})

export const SignalResetCamera = ref(1)
export const SignalShowSettings = ref(false)
export const SignalShowSchedule = ref(false)
export const SignalShowStatistics = ref(false)
export const SignalEditTopology = ref(false)
export const SignalAddNode = ref(0)
export const SignalUpdateLinks = ref(0)
