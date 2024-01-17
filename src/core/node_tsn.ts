import { Node } from './node'
import { PKT_TYPE, type Message, type Packet, MSG_TYPE, type ASNMsgPayload, type InitMsgPayload } from './typedefs'

class TSNNode extends Node {
  constructor() {
    super()
    this.registerMsgHandler(MSG_TYPE.INIT, this.initMsgHandler)
    this.registerMsgHandler(MSG_TYPE.ASN, this.asnMsgHandler)
    this.registerPktHandler(PKT_TYPE.DATA, this.dataPktHandler)
  }
  initMsgHandler = (msg: Message) => {
    const payload: InitMsgPayload = msg.payload
    this.id = payload.id
    this.neighbors = payload.neighbors
  }
  asnMsgHandler = (msg: Message) => {
    const payload: ASNMsgPayload = msg.payload
    this.ASN = payload.asn

    // do something

    postMessage(<Message>{
      type: MSG_TYPE.DONE
    })
  }
  dataPktHandler = (pkt: Packet) => {
    // console.log('tsn', pkt)
  }
}

new TSNNode().Run()
