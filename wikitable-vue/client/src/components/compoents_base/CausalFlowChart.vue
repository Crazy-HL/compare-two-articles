<template>
	<div class="dual-chains-container">
		<div
			v-for="chain in chains"
			:key="chain.country"
			class="country-chain"
			:class="chain.country">
			<div class="chain-header">
				<span class="country-flag">{{ getCountryFlag(chain.country) }}</span>
				<h3>{{ getCountryName(chain.country) }}</h3>
			</div>

			<div class="vertical-chain">
				<div
					v-for="(step, index) in chain.steps"
					:key="index"
					class="chain-step">
					<div class="step-content">
						<div class="step-text">{{ step.text }}</div>
						<div v-if="step.evidence" class="step-evidence">
							<div class="evidence-value">{{ step.evidence }}</div>
						</div>
					</div>

					<div v-if="index < chain.steps.length - 1" class="step-connector">
						<div class="connector-line"></div>
						<div class="connector-arrow">↓</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const props = defineProps({
		chains: {
			type: Array,
			required: true,
			default: () => []
		}
	});

	const getCountryName = code => {
		return code === "korea" ? "韩国" : "日本";
	};

	const getCountryFlag = code => {
		return code === "korea" ? "🇰🇷" : "🇯🇵";
	};
</script>

<style scoped>
	.dual-chains-container {
		display: flex;
		gap: 15px;
		width: 100%;
		margin: 15px 0;
		justify-content: space-between;
	}

	.country-chain {
		flex: 1;
		min-width: 0;
		max-width: calc(50% - 8px);
		background: #f8f9fa;
		border-radius: 10px;
		padding: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.chain-header {
		display: flex;
		align-items: center;
		margin-bottom: 15px;
		padding-bottom: 8px;
		border-bottom: 1px solid #eee;
	}

	.country-flag {
		font-size: 24px;
		margin-right: 10px;
	}

	.chain-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vertical-chain {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.chain-step {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.step-content {
		width: 100%;
		padding: 10px 12px;
		border-radius: 8px;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.step-text {
		font-size: 14px;
		font-weight: 500;
		color: #333;
		line-height: 1.4;
		word-break: break-word;
	}

	.step-evidence {
		margin-top: 8px;
		padding: 6px 8px;
		border-radius: 6px;
		font-size: 12px;
		display: inline-block;
		width: fit-content;
	}

	.step-connector {
		width: 100%;
		height: 16px;
		position: relative;
		display: flex;
		justify-content: center;
	}

	.connector-line {
		width: 2px;
		height: 100%;
		background: #ddd;
		position: absolute;
	}

	.connector-arrow {
		position: absolute;
		top: 100%;
		color: #999;
		font-size: 14px;
		line-height: 0;
		transform: translateY(-50%);
	}

	/* 韩国样式 */
	.country-chain.korea .chain-header h3 {
		color: #1a73e8;
	}

	.country-chain.korea .step-content {
		border-left: 3px solid #1a73e8;
	}

	.country-chain.korea .step-evidence {
		background: #e8f0fe;
		color: #1a73e8;
		border-left: 2px solid #1a73e8;
	}

	/* 日本样式 */
	.country-chain.japan .chain-header h3 {
		color: #9c27b0;
	}

	.country-chain.japan .step-content {
		border-left: 3px solid #9c27b0;
	}

	.country-chain.japan .step-evidence {
		background: #f3e5f5;
		color: #9c27b0;
		border-left: 2px solid #9c27b0;
	}

	@media (max-width: 768px) {
		.dual-chains-container {
			flex-direction: column;
			gap: 15px;
		}

		.country-chain {
			max-width: 100%;
		}

		.step-content {
			padding: 10px 12px;
		}

		.step-text {
			font-size: 13px;
		}

		.connector-arrow {
			font-size: 12px;
		}
	}
</style>
