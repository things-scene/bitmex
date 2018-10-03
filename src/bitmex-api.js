const BITMEX_URL = 'wss://www.bitmex.com'
const ENDPOINT = '/realtimemd'
const AUTH_ENDPOINT = "/realtime"  // for the purpose of the API Key check, we're still using /realtime
const METHOD = 'GET'

const MESSAGE = 0
const SUBSCRIBE = 1
const UNSUBSCRIBE = 2

function signature(apiSecret, verb, url, nonce, postdict) {
  // Given an API Secret key and data, create a BitMEX-compatible signature.
  var data = ''
  if (postdict) {
    // BitMEX expects signatures from JSON built without spaces
    data = JSON.stringify(postdict)
  }

  var parsedURL = new URL(url)
  var message = `${verb}${parsedURL.pathname}${parsedURL.search}${nonce}${data}`

  return crypto.createHmac('sha256', apiSecret).update(message).digest('hex')
}

export class BitMEX {

  constructor() {
    this.connection
    this.sessions = {}
    this.promise
  }

  dispose() {
    if (this.reject) {
      this.reject('disposed')
      delete this.reject
    }
    delete this.promise

    Object.values(this.sessions).forEach(session => {
      session.dispose()
    })

    this.sessions = {}
    delete this.websocket
  }

  connect() {

    if (this.promise) {
      return this.promise
    }

    this.promise = new Promise((resolve, reject) => {
      this.reject = reject

      try {
        var websocket = new WebSocket(BITMEX_URL + ENDPOINT)

        websocket.onmessage = message => {
          var response = JSON.parse(message.data)

          // console.log('onmessage', response)

          let [type, id, topic, payload] = response
          // console.log('session', id, session[id])
          let session = this.sessions[id]

          if (type == MESSAGE) {
            if (session && session.handler) {
              session.handler(payload)
            }

          } else if (type == UNSUBSCRIBE) {
            delete this.sessions[id]
          }
        }

        websocket.onopen = () => {
          this.websocket = websocket

          resolve()

          // setTimeout(() => {
          //   this.websocket.close()
          // }, 3000)
        }

        websocket.onclose = e => {
          var log = '[ BitMES ] connection closed'

          this.dispose()

          console.log(e)
        }

      } catch (e) {
        console.error(e)

        this.dispose()

        reject(e)
      }
    })

    return this.promise
  }

  newId() {
    if (!this.idgen) {
      this.idgen = 0
    }

    return `id-${this.idgen++}`
  }

  async newSession() {
    var id = this.newId()
    var topic = id

    await this.connect()

    var session = new BitMEXSession(this, id, topic)

    this.sessions[id] = session

    var promise = new Promise((resolve, reject) => {
      session.promise = { resolve, reject }

      session.handler = function (data) {

        console.log('handler', data)
        delete session.handler
        delete session.promise

        resolve(session)
      }
    })

    this.websocket.send(JSON.stringify([SUBSCRIBE, id, topic]))

    return promise
  }
}

class BitMEXSession {

  constructor(connection, id, topic) {
    this.connection = connection
    this.id = id
    this.topic = topic
  }

  dispose() {
    this.reject && this.reject('session disposed')
    delete this.reject
  }

  authenticate(apiKey, apiSecret) {

    this.authenticated = false

    let expires = Date.now() + 5
    let sign = signature(apiSecret, METHOD, BITMEX_URL + AUTH_ENDPOINT, expires)

    var payload = {
      op: "authKeyExpires",
      args: [apiKey, expires, sign]
    }

    var promise = new Promise((resolve, reject) => {
      if (this.reject) {
        this.reject('authenticated')
      }

      this.reject = reject

      this.handler = function (data) {

        delete this.handler
        delete this.reject

        if (data.success) {
          resolve(true)
        } else {
          reject(data)
        }
      }
    })

    this.connection.websocket.send(JSON.stringify([MESSAGE, this.id, this.topic, payload]))

    return promise
  }

  subscribe(payload, handler) {

    if (this.reject) {
      this.reject('subscribed')
    }

    var {
      op,
      args
    } = payload

    if (!op || !args) {
      return Promise.reject('invalid payload', payload)
    }

    var promise = new Promise((resolve, reject) => {

      this.reject = reject

      this.handler = data => {

        delete this.handler
        delete this.reject

        if (data.success) {
          this.handler = handler
          resolve(true)
        } else {
          reject(data)
        }
      }
    })

    this.connection.websocket.send(JSON.stringify([MESSAGE, this.id, this.topic, payload]))

    return promise
  }

  unsubscribe() {

    var promise = new Promise((resolve, reject) => {
      if (this.reject) {
        this.reject('unsubscribed')
      }

      this.reject = reject

      this.handler = data => {

        delete this.handler
        delete this.reject

        if (data.success) {
          resolve(true)
        } else {
          reject(data)
        }
      }
    })

    this.connection.websocket.send(JSON.stringify([UNSUBSCRIBE, this.id, this.topic]))

    return promise
  }
}

// export async function connect_with_auth(apiKey, apiSecret) {
//   return new Promise(async (resolve, reject) => {
//     if (!apiKey || !apiSecret) {
//       reject('[ bitmex-quote ] api-key is not configured.')
//       return
//     }

//     try {
//       let connection = await connect()

//       let expires = Date.now() + 5
//       let signature = signature(apiSecret, METHOD, BITMEX_URL + ENDPOINT, expires)

//       connection.ws.onmessage = msg => { // callback on message receipt
//         var response = JSON.parse(msg.data)
//         var request = response.request

//         console.log('onmessage', response)

//         if (request && request.op == 'authKeyExpires') {
//           if (response.success) {
//             resolve(connection)
//           } else {
//             // TODO auth 실패 경우와 subscribe 실패 경우에 따라 처리한다.
//             console.error('[ BitMEX ] authentication failed.')
//             connection.ws.close()

//             reject('[ BitMEX ] authentication failed.')
//           }
//         }
//       }

//       ws.send(JSON.stringify({
//         op: 'authKeyExpires',
//         args: [apiKey, expires, signature]
//       }))

//     } catch (e) {
//       reject(e)
//     }
//   })
// }


// export function create_session(connection) {
//   var id = newId()
//   var topic = 'user_1'

//   var session = {
//     ws: connection.ws,
//     id,
//     topic
//   }
//   connection.session[id] = session

//   var promise = new Promise(resolve => {
//     session.handler = function (data) {

//       console.log('handler', data)
//       delete session.handler

//       resolve(session)
//     }
//   })

//   connection.ws.send(JSON.stringify([SUBSCRIBE, id, topic]))

//   return promise
// }

// export function authenticate(session, apiKey, apiSecret) {

//   session.authenticated = false

//   let expires = Date.now() + 5
//   let sign = signature(apiSecret, METHOD, BITMEX_URL + AUTH_ENDPOINT, expires)

//   var payload = {
//     op: "authKeyExpires",
//     args: [apiKey, expires, sign]
//   }

//   var promise = new Promise((resolve, reject) => {
//     session.handler = function (data) {

//       console.log('handler', data)
//       delete session.handler

//       if (data.success) {
//         resolve(true)
//       } else {
//         reject(data)
//       }
//     }
//   })

//   console.log('session', session)
//   session.ws.send(JSON.stringify([MESSAGE, session.id, session.topic, payload]))

//   return promise
// }

// export async function subscribe(session, payload, handler) {

//   session[subscribe] = {
//     payload,
//     handler
//   }

//   session.ws.send(JSON.stringify([MESSAGE, id, topic, payload]))
//   // var success = await results..

//   return true // success
// }

// export async function unsubscribe(session) {

//   session[closed] = true // ???

//   connection.ws.send(JSON.stringify([UNSUBSCRIBE, id, topic]))
//   // var success = await results..

//   return true // success
// }