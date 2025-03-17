<template>
	<!-- <MainComponent
		pageTitle="LeBron James"
		divId="div1"
		selectContentClass="selectContent1" /> -->
	<ParentComponent
		pageTitle="LeBron James"
		divId="div1"
		selectContentClass="custom-class" />
</template>

<script setup>
	import BaseWikipedia from "@/components/BaseWikipedia.vue";
	import ParentComponent from "@/components/compoents_base/ParentComponent.vue";
</script>
