import { watch } from 'vue'
import * as echarts from 'echarts'

import { ADDR, CELL_TYPES, type Cell } from './typedefs'

import { SchConfig, Schedule, SignalReset } from './useStates'

export function useSchedule(): any {
  const initSchedule = function () {
    Schedule.value = new Array<Cell[]>(SchConfig.num_slots + 1)
    for (let s = 1; s <= SchConfig.num_slots; s++) {
      Schedule.value[s] = new Array<Cell>(SchConfig.num_channels + 1)
    }

    // initial cells
    Schedule.value[1][SchConfig.beacon_channel] = <Cell>{
      type: CELL_TYPES.MGMT,
      slot: 1,
      ch: SchConfig.beacon_channel,
      src: ADDR.ROOT,
      dst: ADDR.BROADCAST
    }
    for (let slot = 2; slot < 2 + SchConfig.num_shared_slots; slot++) {
      Schedule.value[slot][SchConfig.shared_channel] = <Cell>{
        type: CELL_TYPES.SHARED,
        slot: slot,
        ch: SchConfig.shared_channel,
        src: ADDR.ANY,
        dst: ADDR.ANY
      }
    }
  }

  const drawSchedule = function (chartDom: any) {
    const chart = echarts.init(chartDom.value)
    const option: any = {
      grid: {
        top: '42px',
        left: '40px',
        right: '12px',
        bottom: '2px'
      },
      xAxis: {
        name: 'Time',
        type: 'category',
        position: 'top',
        nameLocation: 'center',
        nameGap: '26',
        splitLine: {
          interval: 0,
          show: true,
          lineStyle: { color: 'lightgrey', width: 0.5 }
        },
        data: []
      },
      yAxis: {
        name: 'Channel',
        type: 'category',
        inverse: true,
        nameLocation: 'center',
        nameGap: 20,
        axisLabel: {
          interval: 0
        },
        splitLine: {
          show: true,
          lineStyle: { color: 'lightgrey', width: 0.5 }
        },
        data: []
      },
      visualMap: {
        type: 'piecewise',
        pieces: [
          { value: CELL_TYPES.SHARED, label: 'Shared', color: 'green' },
          { value: CELL_TYPES.MGMT, label: 'Mgmt', color: 'red' },
          { value: CELL_TYPES.DATA, label: 'Data', color: 'royalblue' }
        ],
        itemHeight: 12,
        itemWidth: 18,
        top: 0,
        right: 10,
        orient: 'horizontal'
      },
      series: [
        {
          name: 'Schedule',
          type: 'heatmap',
          itemStyle: {
            borderColor: 'lightgrey',
            borderWidth: 0.5
          },
          label: { show: true, fontSize: 12 },
          animation: false,
          data: []
        }
      ]
    }

    for (let s = 1; s <= SchConfig.num_slots; s++) {
      option.xAxis.data.push(`${s}`)
    }
    for (let c = 1; c <= SchConfig.num_channels; c++) {
      option.yAxis.data.push(`${c}`)
    }

    function drawCells() {
      option.series[0].data = []
      for (let slot = 1; slot <= SchConfig.num_slots; slot++) {
        for (let ch = 1; ch <= SchConfig.num_channels; ch++) {
          const cell = Schedule.value[slot][ch]
          if (cell != undefined) {
            option.series[0].data.push({
              value: [`${slot}`, `${ch}`, cell.type],
              name: `${cell.src}->${cell.dst}`,
              label: {
                formatter: ({ name }: any) => name
              }
            })
          }
        }
      }
    }

    watch(
      Schedule,
      () => {
        drawCells()
        chart.setOption(option)
      },
      { immediate: true, deep: true }
    )

    watch(SignalReset, () => {
      drawCells()
      chart.setOption(option)
    })
  }

  const assignMgmtCells = function (node: number, parent: number): Cell[] {
    const cells: Cell[] = []
    // beacon
    const beacon_cell = findIdleCell(CELL_TYPES.MGMT, node, ADDR.BROADCAST)
    const tx_cell = findIdleCell(CELL_TYPES.MGMT, node, parent)
    const rx_cell = findIdleCell(CELL_TYPES.MGMT, parent, node)

    if (beacon_cell != undefined && tx_cell != undefined && rx_cell != undefined) {
      cells.push(beacon_cell, tx_cell, rx_cell)
    }
    return cells
  }

  const findIdleCell = function (type: number, src: number, dst: number): Cell | undefined {
    for (let slot = 2 + SchConfig.num_shared_slots; slot <= SchConfig.num_slots; slot++) {
      // check conflict
      if (
        Schedule.value[slot].filter(
          (x) => x.src == src || x.src == dst || x.dst == src || x.dst == dst
        ).length > 0
      ) {
        continue
      }
      if (dst == ADDR.BROADCAST) {
        if (Schedule.value[slot][SchConfig.beacon_channel] == undefined) {
          const cell = <Cell>{
            type: type,
            slot: slot,
            ch: SchConfig.beacon_channel,
            src: src,
            dst: dst
          }
          Schedule.value[slot][SchConfig.beacon_channel] = cell
          return cell
        }
      } else {
        for (let ch = 2; ch <= SchConfig.num_channels; ch++) {
          if (Schedule.value[slot][ch] == undefined) {
            const cell = <Cell>{
              type: type,
              slot: slot,
              ch: ch,
              src: src,
              dst: dst
            }
            Schedule.value[slot][ch] = cell
            return cell
          }
        }
      }
    }
    return undefined
  }

  return { initSchedule, drawSchedule, assignMgmtCells }
}
