<template>
	<!-- 大纲切换按钮 -->
	<button @click="toggleOutline" class="toggle-btn" :style="buttonStyle">
		<svg v-if="!isVisible" class="icon" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"></path>
		</svg>
		<svg v-else class="icon close" viewBox="0 0 24 24">
			<path fill="currentColor" d="M6 18L18 6M6 6l12 12"></path>
		</svg>
	</button>

	<!-- 大纲内容 -->
	<div v-if="isVisible" class="outline-container" :style="outlineStyle">
		<div class="outline">
			<ul>
				<li
					v-for="(item, index) in outline"
					:key="item.id"
					:class="{ highlight: isLinked(item), linked: isLinked(item) }"
					:style="{ paddingLeft: `${(item.level - 1) * 15}px` }">
					<a :href="'#' + item.id" @click.prevent="scrollToChapter(item.id)">{{
						item.text
					}}</a>
				</li>
			</ul>
		</div>
	</div>
</template>

<script setup>
	import { ref, watch, onMounted, onUnmounted } from "vue";
	import eventBus from "@/js/eventBus.js";

	const props = defineProps({
		content: String, // 文章 HTML
		divId: String // "div1" 或 "div3"
	});

	const isVisible = ref(false);
	const outline = ref([]);
	const buttonStyle = ref({});
	const outlineStyle = ref({});
	const linkedOutline = ref([]); // 共享的关联章节数据

	// **切换大纲的显示**
	const toggleOutline = () => {
		isVisible.value = !isVisible.value;
	};

	// **解析文章，提取 h1-h6 标题**
	const extractOutline = (content, containerId) => {
		if (!content) return [];
		const parser = new DOMParser();
		const doc = parser.parseFromString(content, "text/html");
		const headings = doc.querySelectorAll("h1, h2, h3, h4, h5, h6");

		return Array.from(headings).map((heading, index) => {
			const level = parseInt(heading.tagName.substring(1));
			const id = `heading-${index}-${containerId}`;
			heading.id = id;
			return { id, text: heading.textContent, level };
		});
	};

	// **动态生成关联关系**    结合 标准化处理 + 编辑距离 + 关键词匹配
	const normalizeText = text => {
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, "") // 移除标点
			.replace(/\b(the|a|an|of|in|on|and|or|to|with|for)\b/g, "") // 移除停用词
			.trim();
	};

	// 归一化编辑距离（Levenshtein Ratio）
	const levenshteinRatio = (a, b) => {
		const lenA = a.length;
		const lenB = b.length;
		const distance = levenshteinDistance(a, b);
		return 1 - distance / Math.max(lenA, lenB); // 归一化到 [0,1] 之间
	};

	// Jaccard 相似度计算
	const jaccardSimilarity = (text1, text2) => {
		const words1 = new Set(text1.split(/\s+/));
		const words2 = new Set(text2.split(/\s+/));
		const intersection = new Set([...words1].filter(word => words2.has(word)));
		const union = new Set([...words1, ...words2]);
		return intersection.size / union.size; // 计算 Jaccard 相似度
	};
	const levenshteinDistance = (a, b) => {
		const dp = Array(a.length + 1)
			.fill(null)
			.map(() => Array(b.length + 1).fill(0));

		for (let i = 0; i <= a.length; i++) dp[i][0] = i;
		for (let j = 0; j <= b.length; j++) dp[0][j] = j;

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				const cost = a[i - 1] === b[j - 1] ? 0 : 1;
				dp[i][j] = Math.min(
					dp[i - 1][j] + 1,
					dp[i][j - 1] + 1,
					dp[i - 1][j - 1] + cost
				);
			}
		}

		return dp[a.length][b.length];
	};

	// 综合相似度计算
	const isSimilar = (text1, text2, levThreshold = 0.7, jacThreshold = 0.5) => {
		const normText1 = normalizeText(text1);
		const normText2 = normalizeText(text2);
		const levRatio = levenshteinRatio(normText1, normText2);
		const jacSim = jaccardSimilarity(normText1, normText2);

		// 设定动态权重
		const weightedScore = 0.7 * levRatio + 0.3 * jacSim;
		return weightedScore >= 0.65; // 设定合适的匹配阈值
	};

	const generateLinkedOutline = (outline1, outline2) => {
		const linked = [];
		outline1.forEach(item1 => {
			outline2.forEach(item2 => {
				if (isSimilar(item1.text, item2.text)) {
					linked.push({ leftId: item1.id, rightId: item2.id });
				}
			});
		});
		return linked;
	};

	// **监听 content 变化，更新大纲**
	watch(
		() => props.content,
		newContent => {
			outline.value = extractOutline(newContent, props.divId);

			// 提取另一个容器的大纲数据
			const otherContainerId = props.divId === "div1" ? "div3" : "div1";
			const otherContainer = document.getElementById(otherContainerId);
			if (otherContainer) {
				const otherContent = otherContainer.innerHTML;
				const otherOutline = extractOutline(otherContent, otherContainerId);
				const newLinkedOutline = generateLinkedOutline(
					outline.value,
					otherOutline
				);
				linkedOutline.value = newLinkedOutline;

				// 通过 eventBus 通知另一个大纲组件
				eventBus.emit("update-linked-outline", newLinkedOutline);
			}
		},
		{ immediate: true }
	);

	// **监听 eventBus，确保两边大纲同步**
	eventBus.on("update-linked-outline", newLinkedOutline => {
		linkedOutline.value = newLinkedOutline;
	});

	// **检查是否存在关联章节**
	const isLinked = item =>
		linkedOutline.value.some(
			linked => linked.leftId === item.id || linked.rightId === item.id
		);

	// **滚动到章节**
	const scrollToChapter = id => {
		// 跳转到当前文章的章节
		const element = document.getElementById(id);
		if (element) element.scrollIntoView({ behavior: "smooth" });

		// 找到关联章节并跳转
		const linkedItem = linkedOutline.value.find(
			linked => linked.leftId === id || linked.rightId === id
		);
		if (linkedItem) {
			const targetId =
				linkedItem.leftId === id ? linkedItem.rightId : linkedItem.leftId;
			eventBus.emit("scroll-to-chapter", targetId);
		}
	};

	// **监听 eventBus，确保两个组件同步跳转**
	eventBus.on("scroll-to-chapter", targetId => {
		const targetElement = document.getElementById(targetId);
		if (targetElement) targetElement.scrollIntoView({ behavior: "smooth" });
	});

	// **更新按钮和大纲的相对位置**
	const updatePosition = () => {
		const isDiv1 = props.divId === "div1";
		buttonStyle.value = {
			position: "absolute",
			top: "10px",
			[isDiv1 ? "right" : "left"]: "10px"
		};
		outlineStyle.value = {
			position: "absolute",
			top: "50px",
			[isDiv1 ? "right" : "left"]: "10px",
			width: "260px",
			maxHeight: "80vh",
			overflowY: "auto",
			zIndex: "1000",
			background: "white",
			borderRadius: "8px",
			boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
			padding: "15px"
		};
	};

	// **窗口滚动时更新大纲位置**
	const handleScroll = () => {
		const referenceElement = document.getElementById(props.divId);
		if (!referenceElement) return;

		const scrollY = referenceElement.scrollTop;
		buttonStyle.value.top = `${scrollY + 10}px`;
		outlineStyle.value.top = `${scrollY + 50}px`;
	};

	// **初始化**
	onMounted(() => {
		outline.value = extractOutline(props.content, props.divId);
		updatePosition();
		const referenceElement = document.getElementById(props.divId);
		if (referenceElement)
			referenceElement.addEventListener("scroll", handleScroll);
	});

	// **组件销毁时移除事件**
	onUnmounted(() => {
		const referenceElement = document.getElementById(props.divId);
		if (referenceElement)
			referenceElement.removeEventListener("scroll", handleScroll);
		eventBus.off("update-linked-outline");
		eventBus.off("scroll-to-chapter");
	});
</script>

<style scoped>
	/* **按钮样式** */
	.toggle-btn {
		padding: 10px;
		border-radius: 50%;
		cursor: pointer;
		z-index: 2000;
		background-color: #0077b6;
		color: white;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease-in-out;
	}

	/* **大纲样式** */
	.outline-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 15px;
		max-height: 80vh;
		overflow-y: auto;
		width: 260px;
		transition: all 0.3s ease-in-out;
	}

	.outline ul {
		list-style-type: none;
		padding-left: 0;
	}

	.outline li {
		margin-bottom: 8px;
		font-size: 14px;
		transition: padding-left 0.2s ease-in-out;
	}

	/* **高亮和关联章节样式** */
	.outline li.highlight a {
		background-color: #ffff00;
		border-radius: 5px;
	}

	.outline li.linked a {
		font-weight: bold;
		color: #0077b6;
	}

	.outline li a {
		text-decoration: none;
		color: #0077b6;
	}

	.outline li a:hover {
		text-decoration: underline;
		color: #005f8a;
	}
</style>
