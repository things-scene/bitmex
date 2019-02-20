/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

// import React from "react";
// import PropTypes from "prop-types";

// import { scaleTime } from "d3-scale";
// import { utcDay } from "d3-time";

// import { ChartCanvas, Chart } from "react-stockcharts";
// import { CandlestickSeries } from "react-stockcharts/lib/series";
// import { XAxis, YAxis } from "react-stockcharts/lib/axes";
// import { fitWidth } from "react-stockcharts/lib/helper";
// import { last, timeIntervalBarWidth } from "react-stockcharts/lib/utils";

// class CandleStickChart extends React.Component {
// 	render() {
// 		const { type, width, data, ratio } = this.props;
// 		const xAccessor = d => d.date;
// 		const xExtents = [
// 			xAccessor(last(data)),
// 			xAccessor(data[data.length - 100])
// 		];
// 		return (
// 			<ChartCanvas height={400}
// 					ratio={ratio}
// 					width={width}
// 					margin={{ left: 50, right: 50, top: 10, bottom: 30 }}
// 					type={type}
// 					seriesName="MSFT"
// 					data={data}
// 					xAccessor={xAccessor}
// 					xScale={scaleTime()}
// 					xExtents={xExtents}>

// 				<Chart id={1} yExtents={d => [d.high, d.low]}>
// 					<XAxis axisAt="bottom" orient="bottom" ticks={6}/>
// 					<YAxis axisAt="left" orient="left" ticks={5} />
// 					<CandlestickSeries width={timeIntervalBarWidth(utcDay)}/>
// 				</Chart>
// 			</ChartCanvas>
// 		);
// 	}
// }

// CandleStickChart.propTypes = {
// 	data: PropTypes.array.isRequired,
// 	width: PropTypes.number.isRequired,
// 	ratio: PropTypes.number.isRequired,
// 	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
// };

// CandleStickChart.defaultProps = {
// 	type: "svg",
// }

// CandleStickChart = fitWidth(CandleStickChart)


const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties : [{
    type: 'number',
    label: 'value',
    name: 'value'
  },{
    type: 'angle',
    label: 'angle property',
    name: 'propAngle'
  },{
    type: 'string',
    label: 'string property',
    name: 'propString'
  },{
    type: 'color',
    label: 'color property',
    name: 'propColor'
  }]
}

import { Component, ValueHolder, RectPath, Shape, error } from '@hatiolab/things-scene';




export default class CandleStickChart extends ValueHolder(RectPath(Shape)) {

  static get nature() {
    return NATURE;
  }

  dispose() {
    super.dispose();
  }

  render(context) {
    var {
      top,
      left,
      height,
      width,
      backgroundColor = 'transparent',
      reverse
    } = this.model;

    this.animOnValueChange(this.value);

    // background의 색상
    context.beginPath();
    context.rect(left, top, width, height);

    context.fillStyle = backgroundColor;
    context.fill();

    // value의 색상
    context.beginPath();

    var drawValue = width - width * Math.max(Math.min(this.animValue, 100), 0) / 100;
    drawValue = Math.max(Math.min(drawValue, width), 0);

    context.rect(left + drawValue, top, width - drawValue, height);

    this.drawFill(context);

    context.closePath();

    context.beginPath();

    context.rect(left, top, width, height);
  }

  postrender(context) {
    this.drawStroke(context);
    this.drawText(context);
  }

  get controls() {}
}

Component.register('candle-stick-chart', CandleStickChart);
