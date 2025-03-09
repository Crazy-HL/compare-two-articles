// chartUtils.js
import * as d3 from "d3";

// 渲染折线图（line）
export function renderLineChart(chartRef, data, options) {
    if (!chartRef) {
        console.error("图表容器未找到");
        return;
    }

    console.log("渲染折线图数据:", data);

    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 清空之前的图表
    d3.select(chartRef).html("");

    // 创建 SVG 容器
    const svg = d3
        .select(chartRef)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = data.labels;
    const datasets = data.datasets;

    // 清理数据
    const cleanedLabels = labels.map(label =>
        label === undefined || label === null ? "" : label
    );
    const cleanedDatasets = datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.map(d => (d === undefined || d === null ? 0 : d))
    }));

    console.log("清理后的 labels:", cleanedLabels);
    console.log("清理后的 datasets:", cleanedDatasets);

    // 设置 X 轴比例尺
    const x = d3
        .scaleBand()
        .domain(cleanedLabels)
        .range([0, width])
        .padding(0.1);

    // 设置 Y 轴比例尺
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(cleanedDatasets.flatMap(d => d.data))])
        .range([height, 0]);

    console.log("X 比例尺 domain:", x.domain());
    console.log("X 比例尺 range:", x.range());
    console.log("Y 比例尺 domain:", y.domain());
    console.log("Y 比例尺 range:", y.range());

    // 添加 X 轴
    svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // 添加 Y 轴
    svg.append("g").call(d3.axisLeft(y));

    // 添加 X 轴标题
    svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text(options.scales.x.title.text);

    // 添加 Y 轴标题
    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .text(options.scales.y.title.text);

    // 绘制折线
    cleanedDatasets.forEach(dataset => {
        const line = d3
            .line()
            .x((d, i) => {
                const xValue = x(cleanedLabels[i]) + x.bandwidth() / 2;
                if (isNaN(xValue)) {
                    console.error(
                        "无效的 x 值:",
                        xValue,
                        "labels[i]:",
                        cleanedLabels[i]
                    );
                }
                return xValue;
            })
            .y(d => {
                const yValue = y(d);
                if (isNaN(yValue)) {
                    console.error("无效的 y 值:", yValue, "d:", d);
                }
                return yValue;
            });

        svg
            .append("path")
            .datum(dataset.data)
            .attr("fill", "none")
            .attr("stroke", dataset.borderColor)
            .attr("stroke-width", 2)
            .attr("d", line);

        // 添加数据点
        svg
            .selectAll(`.dot-${CSS.escape(dataset.label)}`)
            .data(dataset.data)
            .enter()
            .append("circle")
            .attr("cx", (d, i) => {
                const cxValue = x(cleanedLabels[i]) + x.bandwidth() / 2;
                if (isNaN(cxValue)) {
                    console.error(
                        "无效的 cx 值:",
                        cxValue,
                        "labels[i]:",
                        cleanedLabels[i]
                    );
                }
                return cxValue;
            })
            .attr("cy", d => {
                const cyValue = y(d);
                if (isNaN(cyValue)) {
                    console.error("无效的 cy 值:", cyValue, "d:", d);
                }
                return cyValue;
            })
            .attr("r", 4)
            .attr("fill", dataset.borderColor);
    });

    // 添加图例
    const legend = svg
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + margin.right - 100}, 20)`);

    cleanedDatasets.forEach((dataset, index) => {
        const legendItem = legend
            .append("g")
            .attr("transform", `translate(0, ${index * 20})`);

        // 添加颜色方块
        legendItem
            .append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", dataset.borderColor);

        // 添加标签
        legendItem
            .append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(dataset.label);
    });
}

// 渲染柱状图（bar）
export function renderBarChart(chartRef, data, options) {
    if (!chartRef) {
        console.error("图表容器未找到");
        return;
    }

    console.log("渲染柱状图数据:", data);

    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 清空之前的图表
    d3.select(chartRef).html("");

    // 创建 SVG 容器
    const svg = d3
        .select(chartRef)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = data.labels;
    const datasets = data.datasets;

    // 清理数据
    const cleanedLabels = labels.map(label =>
        label === undefined || label === null ? "" : label
    );
    const cleanedDatasets = datasets.map(dataset => ({
        ...dataset,
        data: dataset.data.map(d => (d === undefined || d === null ? 0 : d))
    }));

    console.log("清理后的 labels:", cleanedLabels);
    console.log("清理后的 datasets:", cleanedDatasets);

    // 设置 X 轴比例尺
    const x = d3
        .scaleBand()
        .domain(cleanedLabels)
        .range([0, width])
        .padding(0.1);

    // 设置 Y 轴比例尺
    const y = d3
        .scaleLinear()
        .domain([0, d3.max(cleanedDatasets.flatMap(d => d.data))])
        .range([height, 0]);

    console.log("X 比例尺 domain:", x.domain());
    console.log("X 比例尺 range:", x.range());
    console.log("Y 比例尺 domain:", y.domain());
    console.log("Y 比例尺 range:", y.range());

    // 添加 X 轴
    svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // 添加 Y 轴
    svg.append("g").call(d3.axisLeft(y));

    // 添加 X 轴标题
    svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text(options.scales.x.title.text);

    // 添加 Y 轴标题
    svg
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .text(options.scales.y.title.text);

    // 绘制柱状图
    cleanedDatasets.forEach(dataset => {
        svg
            .selectAll(".bar")
            .data(dataset.data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => x(cleanedLabels[i]))
            .attr("y", d => y(d))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d))
            .attr("fill", dataset.backgroundColor);
    });

    // 添加图例
    const legend = svg
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + margin.right - 100}, 20)`);

    cleanedDatasets.forEach((dataset, index) => {
        const legendItem = legend
            .append("g")
            .attr("transform", `translate(0, ${index * 20})`);

        // 添加颜色方块
        legendItem
            .append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", dataset.backgroundColor);

        // 添加标签
        legendItem
            .append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(dataset.label);
    });
}

// 渲染饼图（pie）
export function renderPieChart(chartRef, data, options) {
    console.log("渲染饼图数据:", data);
}

// 渲染非可视化数据的默认占位图表
export function renderNonVisualChart(chartRef, data, options) {
    if (!chartRef) {
        console.error("图表容器未找到");
        return;
    }

    console.log("渲染非可视化数据图表:", data);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 300 - margin.left - margin.right; // 图表宽度
    const height = 200 - margin.top - margin.bottom; // 图表高度

    // 清空容器，确保重新渲染
    d3.select(chartRef).html("");

    // 创建 SVG 容器
    const svg = d3
        .select(chartRef)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // 添加背景矩形
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8f9fa") // 轻灰色背景
        .attr("rx", 12) // 圆角边框
        .attr("ry", 12)
        .style("stroke", "#ccc") // 边框颜色
        .style("stroke-width", 1);

    // 添加占位文本
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2 - 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("fill", "#555")
        .style("font-weight", "bold")
        .text("数据不可视化");

    // 添加可选的提示信息
    if (options?.message) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2 + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#777")
            .text(options.message);
    }
}
