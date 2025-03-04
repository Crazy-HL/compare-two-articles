<script>
	import general from "./components/general.vue";
	import Vis2 from "./components/Vis2.vue";
	export default {
		name: "App",
		components: {
			general,
			Vis2
		},
		mounted() {
			this.getData();
		},
		methods: {
			getData() {
				let self = this;
				// api.get("data", { papername: "rmap1" }, data => {
				// 	Data = data;
				// 	store.state.loaddata = Math.random();
				// });
				// api.get("", {}, data => {
				// 	console.log("@@@", data);
				// });
			}
		}
	};
</script>

<template>
	<general></general>
	<!-- <Vis2></Vis2> -->
</template>

<style scoped></style>
