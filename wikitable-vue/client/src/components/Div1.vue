<template>
	<!-- <MainComponent
		pageTitle="LeBron James"
		divId="div1"
		selectContentClass="selectContent1" /> -->
	<!-- <ParentComponent
		pageTitle="Kevin Durant"
		divId="div1"
		selectContentClass="selectContent1"
		:linkedOutline="linkedOutline" /> -->
	<ParentComponent
		pageTitle="Economy of South Korea"
		divId="div1"
		selectContentClass="selectContent1"
		:linkedOutline="linkedOutline" />
</template>

<script setup>
	import BaseWikipedia from "@/components/BaseWikipedia.vue";
	import ParentComponent from "@/components/compoents_base/ParentComponent.vue";
	// const linkedOutline = [
	// 	{ leftId: "heading-0-div1", rightId: "heading-0-div3" },
	// 	{ leftId: "heading-3-div1", rightId: "heading-3-div3" },
	// 	{ leftId: "heading-9-div1", rightId: "heading-12-div3" },
	// 	{ leftId: "heading-23-div1", rightId: "heading-13-div3" },
	// 	{ leftId: "heading-24-div1", rightId: "heading-14-div3" },
	// 	{ leftId: "heading-25-div1", rightId: "heading-19-div3" },
	// 	{ leftId: "heading-26-div1", rightId: "heading-15-div3" },
	// 	{ leftId: "heading-28-div1", rightId: "heading-16-div3" },
	// 	{ leftId: "heading-30-div1", rightId: "heading-17-div3" },
	// 	{ leftId: "heading-32-div1", rightId: "heading-32-div3" },
	// 	{ leftId: "heading-33-div1", rightId: "heading-33-div3" },
	// 	{ leftId: "heading-34-div1", rightId: "heading-35-div3" },
	// 	{ leftId: "heading-35-div1", rightId: "heading-37-div3" }
	// ];

	const linkedOutline = [
		{ leftId: "heading-0-div1", rightId: "heading-0-div3" },
		{ leftId: "heading-1-div1", rightId: "heading-1-div3" },
		{ leftId: "heading-2-div1", rightId: "heading-2-div3" },
		{ leftId: "heading-3-div1", rightId: "heading-3-div3" },
		{ leftId: "heading-7-div1", rightId: "heading-5-div3" },
		{ leftId: "heading-8-div1", rightId: "heading-6-div3" },
		{ leftId: "heading-11-div1", rightId: "heading-8-div3" },
		{ leftId: "heading-12-div1", rightId: "heading-9-div3" },
		{ leftId: "heading-13-div1", rightId: "heading-10-div3" },
		{ leftId: "heading-17-div1", rightId: "heading-12-div3" },
		{ leftId: "heading-18-div1", rightId: "heading-13-div3" },
		{ leftId: "heading-19-div1", rightId: "heading-14-div3" },
		{ leftId: "heading-24-div1", rightId: "heading-15-div3" },
		{ leftId: "heading-23-div1", rightId: "heading-16-div3" },
		{ leftId: "heading-25-div1", rightId: "heading-22-div3" },
		{ leftId: "heading-26-div1", rightId: "heading-17-div3" },
		{ leftId: "heading-27-div1", rightId: "heading-18-div3" },
		{ leftId: "heading-28-div1", rightId: "heading-19-div3" },
		{ leftId: "heading-30-div1", rightId: "heading-20-div3" },
		{ leftId: "heading-31-div1", rightId: "heading-21-div3" },
		{ leftId: "heading-33-div1", rightId: "heading-24-div3" },
		{ leftId: "heading-34-div1", rightId: "heading-25-div3" },
		{ leftId: "heading-35-div1", rightId: "heading-26-div3" }
	];
</script>
