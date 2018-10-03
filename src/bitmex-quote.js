/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from './bitmex-quote.png';

import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'

const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties: [{
    type: 'string',
    label: 'connection',
    name: 'connection'
  }, {
    type: 'string',
    label: 'topic',
    name: 'topic'
  }, {
    type: 'string',
    label: 'symbol',
    name: 'symbol'
  }]
}

export default class BitMEXQuote extends DataSource(RectPath(Shape)) {

  static get image() {
    if (!BitMEXQuote._image) {
      BitMEXQuote._image = new Image();
      BitMEXQuote._image.src = COMPONENT_IMAGE;
    }

    return BitMEXQuote._image;
  }

  static get connection() {
    if (!BitMEXQuote._connection) {
      BitMEXQuote._connection = new BitMEXConnection()
    }

    return BitMEXQuote._connection
  }

  async ready() {
    super.ready()

    if (!this.app.isViewMode)
      return

    await this._subscribe()
  }

  get connection() {
    var {
      connection
    } = this.model

    if (connection) {
      return this.root.findById(connection)
    }
  }

  async _subscribe() {
    var {
      topic,
      symbol
    } = this.model

    console.log(topic, symbol, this.connection)
    if (!this.connection || !topic || !symbol) {
      return
    }

    try {
      this.session = await this.connection.subscribe({
        op: "subscribe",
        args: [
          `${topic}:${symbol}`
        ]
      }, data => {
        console.log(data)
        this.set('data', data)
      })
    } catch (e) {
      console.error('catched', e)
    }
  }

  dispose() {
    this.session && this.session.dispose()
    delete this.session

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
    context.drawImage(BitMEXQuote.image, left, top, width, height);
  }

  get nature() {
    return NATURE;
  }

}

Component.register('bitmex-quote', BitMEXQuote);
