/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from './bitmex-quote.png';

import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'
import { BitMEX } from './bitmex-api'

const NONAUTH_TOPICS = [
  "announcement",// Site announcements
  "chat",        // Trollbox chat
  "connected",   // Statistics of connected users/bots
  "funding",     // Updates of swap funding rates. Sent every funding interval (usually 8hrs)
  "instrument",  // Instrument updates including turnover and bid/ask
  "insurance",   // Daily Insurance Fund updates
  "liquidation", // Liquidation orders as they're entered into the book
  "orderBookL2", // Full level 2 orderBook
  "orderBook10", // Top 10 levels using traditional full book push
  "publicNotifications", // System-wide notifications (used for short-lived messages)
  "quote",       // Top level of the book
  "quoteBin1m",  // 1-minute quote bins
  "quoteBin5m",  // 5-minute quote bins
  "quoteBin1h",  // 1-hour quote bins
  "quoteBin1d",  // 1-day quote bins
  "settlement",  // Settlements
  "trade",       // Live trades
  "tradeBin1m",  // 1-minute trade bins
  "tradeBin5m",  // 5-minute trade bins
  "tradeBin1h",  // 1-hour trade bins
  "tradeBin1d"   // 1-day trade bins
]

const AUTH_TOPICS = [
  "affiliate",   // Affiliate status, such as total referred users & payout %
  "execution",   // Individual executions; can be multiple per order
  "order",       // Live updates on your orders
  "margin",      // Updates on your current account balance and margin requirements
  "position",    // Updates on your positions
  "privateNotifications", // Individual notifications - currently not used
  "transact",    // Deposit/Withdrawal updates
  "wallet"       // Bitcoin address balance data, including total deposits & withdrawals
]

const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties: [{
    type: 'string',
    label: 'api-key',
    name: 'apiKey'
  }, {
    type: 'string',
    label: 'api-secret',
    name: 'apiSecret'
  }]
}

export default class BitMEXConnection extends DataSource(RectPath(Shape)) {

  static get image() {
    if (!BitMEXConnection._image) {
      BitMEXConnection._image = new Image();
      BitMEXConnection._image.src = COMPONENT_IMAGE;
    }

    return BitMEXConnection._image;
  }

  get connection() {
    if (!this._connection) {
      this._connection = new BitMEX()
    }

    return this._connection
  }

  async connect() {
    return await this.connection.newSession()
  }

  async authenticate(session) {
    var {
      apiKey,
      apiSecret
    } = this.model

    session.authenticate(apiKey, apiSecret)
  }

  async subscribe(payload, handler) {
    var {
      args
    } = payload
    var topic = args[0].split(':')[0]
    var auth_topic

    if (AUTH_TOPICS.indexOf(topic) != -1) {
      console.log('auth required topic', topic)
      auth_topic = true
    } else if (NONAUTH_TOPICS.indexOf(topic) == -1) {
      console.log('non topic', topic)
      return
    }

    var session = await this.connect()
    auth_topic && await this.authenticate(session)
    await session.subscribe(payload, handler)

    return session
  }

  async unsubscribe(session) {
    session.unsubscribe()
  }

  dispose() {
    this._connection && this._connection.dispose()
    delete this._connection

    super.dispose()
  }

  render(context) {

    /*
     * TODO role이 publisher 인지 subscriber 인지에 따라서 구분할 수 있는 표시를 추가할 것.
     */

    var {
      left,
      top,
      width,
      height
    } = this.bounds;

    context.beginPath();
    context.drawImage(BitMEXConnection.image, left, top, width, height);
  }

  get nature() {
    return NATURE;
  }
}

Component.register('bitmex-conn', BitMEXConnection);
