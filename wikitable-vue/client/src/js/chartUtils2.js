// src/js/chartUtils.js
import * as d3 from 'd3';

// 通用图表配置
const chartConfig = {
  margin: { top: 20, right: 20, bottom: 40, left: 40 },
  colors: d3.schemeTableau10,
  transitionDuration: 500
};

/**
 * 渲染柱状图
 * @param {HTMLElement} container - 图表容器
 * @param {Object} config - 图表配置
 * @param {Array} config.data - 数据数组 [{name, value}]
 * @param {String} config.title - 图表标题
 */
export const renderBarChart = (container, config) => {
  if (!container) return;

  // 清空容器
  container.innerHTML = '';

  // 提取数据
  const data = config.data || [];
  const title = config.title || '';

  // 设置尺寸
  const width = container.clientWidth;
  const height = container.clientHeight;
  const innerWidth = width - chartConfig.margin.left - chartConfig.margin.right;
  const innerHeight = height - chartConfig.margin.top - chartConfig.margin.bottom;

  // 创建SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // 添加标题
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(title);

  // 创建主图形区域
  const g = svg.append('g')
    .attr('transform', `translate(${chartConfig.margin.left}, ${chartConfig.margin.top})`);

  // 设置比例尺
  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([0, innerWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([innerHeight, 0]);

  // 添加X轴
  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  // 添加Y轴
  g.append('g')
    .attr('class', 'axis axis-y')
    .call(d3.axisLeft(y).ticks(5));

  // 添加柱状
  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => innerHeight - y(d.value))
    .attr('fill', (d, i) => chartConfig.colors[i % chartConfig.colors.length]);

  // 添加数值标签
  g.selectAll('.bar-label')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => x(d.name) + x.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .text(d => d.value);
};

/**
 * 渲染饼图
 * @param {HTMLElement} container - 图表容器
 * @param {Object} config - 图表配置
 * @param {Array} config.data - 数据数组 [{name, value}]
 * @param {String} config.title - 图表标题
 */
export const renderPieChart = (container, config) => {
  if (!container) return;

  // 清空容器
  container.innerHTML = '';

  // 提取数据
  const data = config.data || [];
  const title = config.title || '';

  // 设置尺寸
  const width = container.clientWidth;
  const height = container.clientHeight;
  const radius = Math.min(width, height) / 2 - 20;

  // 创建SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // 添加标题
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(title);

  // 创建主图形区域
  const g = svg.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  // 创建饼图布局
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null);

  // 创建弧生成器
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  // 创建颜色比例尺
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(chartConfig.colors);

  // 绘制扇形
  const arcs = g.selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.name))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1);

  // 添加标签
  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('dy', '0.35em')
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .text(d => `${d.data.name}: ${d.data.value}`);
};

/**
 * 渲染折线图
 * @param {HTMLElement} container - 图表容器
 * @param {Object} config - 图表配置
 * @param {Array} config.data - 数据数组 [{name, value}]
 * @param {String} config.title - 图表标题
 */
export const renderLineChart = (container, config) => {
  if (!container) return;

  // 清空容器
  container.innerHTML = '';

  // 提取数据
  const data = config.data || [];
  const title = config.title || '';

  // 设置尺寸
  const width = container.clientWidth;
  const height = container.clientHeight;
  const innerWidth = width - chartConfig.margin.left - chartConfig.margin.right;
  const innerHeight = height - chartConfig.margin.top - chartConfig.margin.bottom;

  // 创建SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // 添加标题
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(title);

  // 创建主图形区域
  const g = svg.append('g')
    .attr('transform', `translate(${chartConfig.margin.left}, ${chartConfig.margin.top})`);

  // 设置比例尺
  const x = d3.scalePoint()
    .domain(data.map(d => d.name))
    .range([0, innerWidth])
    .padding(0.5);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .nice()
    .range([innerHeight, 0]);

  // 创建折线生成器
  const line = d3.line()
    .x(d => x(d.name))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  // 添加X轴
  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x));

  // 添加Y轴
  g.append('g')
    .attr('class', 'axis axis-y')
    .call(d3.axisLeft(y).ticks(5));

  // 添加折线路径
  g.append('path')
    .datum(data)
    .attr('class', 'line')
    .attr('d', line)
    .attr('fill', 'none')
    .attr('stroke', chartConfig.colors[0])
    .attr('stroke-width', 2);

  // 添加数据点
  g.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.name))
    .attr('cy', d => y(d.value))
    .attr('r', 4)
    .attr('fill', chartConfig.colors[0]);
};

/**
 * 渲染简单数值显示（用于非可视化数据）
 * @param {HTMLElement} container - 容器元素
 * @param {Object} config - 配置对象
 * @param {String} config.message - 显示的消息
 */
export const renderNonVisualChart = (container, config) => {
  if (!container) return;
  
  container.innerHTML = `
    <div class="non-visual-message">
      <div class="message">${config.message || '无可视化数据'}</div>
      ${config.value ? `<div class="value">${config.value}</div>` : ''}
    </div>
  `;
};

/**
 * 智能图表渲染（自动选择最合适的图表类型）
 * @param {HTMLElement} container - 图表容器
 * @param {Object} data - 要渲染的数据
 * @param {String} title - 图表标题
 */
export const renderChart = (container, data, title = '') => {
  if (!container) return;

  // 根据数据类型自动选择图表类型
  if (Array.isArray(data)) {
    if (data.length > 8) {
      renderLineChart(container, { data, title });
    } else {
      renderBarChart(container, { data, title });
    }
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length <= 6) {
      renderPieChart(container, { 
        data: entries.map(([name, value]) => ({ name, value })), 
        title 
      });
    } else {
      renderBarChart(container, { 
        data: entries.map(([name, value]) => ({ name, value })), 
        title 
      });
    }
  } else {
    renderNonVisualChart(container, { 
      message: '简单数值', 
      value: data 
    });
  }
};