/**
 * AI Service Integration Configuration (Future Enhancement)
 *
 * This file contains configuration and utilities for integrating
 * AI services like Ollama, Mastra AI, OpenAI, etc. for advanced
 * relationship analysis based on conversation patterns.
 *
 * @module ai-config
 * @future-enhancement
 */

/**
 * Ollama Integration
 *
 * Ollama is a local LLM runtime that allows running models like Llama, Mistral, etc.
 * Benefits:
 * - Privacy: All data stays local
 * - No API costs
 * - Fast response times
 * - Works offline
 *
 * Setup:
 * 1. Install Ollama: https://ollama.ai
 * 2. Pull a model: `ollama pull llama2`
 * 3. Configure endpoint below
 */
export const ollamaConfig = {
	enabled: false, // Set to true to enable
	endpoint: 'http://localhost:11434',
	model: 'llama2', // Options: llama2, mistral, codellama, etc.
	timeout: 30_000,
};

/**
 * Mastra AI Integration
 *
 * Mastra is a framework for building AI agents with multiple LLM providers
 * Benefits:
 * - Multi-provider support
 * - Agent workflows
 * - Memory and context management
 * - Built-in tools and functions
 *
 * Setup:
 * 1. Install Mastra: npm install @mastra/core
 * 2. Configure API keys for chosen provider
 * 3. Set up agent workflows
 */
export const mastraConfig = {
	enabled: false,
	provider: 'openai' as 'openai' | 'anthropic' | 'ollama',
	apiKey: '', // Set via environment variable MASTRA_API_KEY
	model: 'gpt-4-turbo-preview',
	agentConfig: {
		systemPrompt: `You are an expert at analyzing social relationships based on conversation patterns.
Your task is to evaluate the strength and health of relationships based on:
- Message frequency and consistency
- Response times and engagement
- Emotional tone and sentiment
- Conversation depth and quality
- Balance of initiation and participation

Provide insights that help users identify genuine friendships vs superficial connections.`,
		temperature: 0.7,
		maxTokens: 1000,
	},
};

/**
 * Analysis Prompts for AI Services
 *
 * These prompts guide the AI in analyzing relationships
 */
export const analysisPrompts = {
	sentiment: `Analyze the sentiment and emotional quality of this conversation:

Messages: {messages}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Emotional depth score (0-100)
3. Engagement quality score (0-100)
4. Conversation balance (who dominates)

Format as JSON.`,

	relationshipStrength: `Evaluate the relationship strength based on this data:

Conversation pattern: {pattern}
Sentiment analysis: {sentiment}
User context: {context}

Provide:
1. Overall relationship score (0-100)
2. Relationship classification (close-friend/casual-friend/acquaintance/one-sided/inactive)
3. Key strengths and weaknesses
4. Actionable recommendations

Format as JSON.`,

	fakeFriendDetection: `Based on the following data about a social media connection, determine if this is a "fake friend":

Profile: {profile}
Relationship: {relationship}
Activity: {activity}
Conversation: {conversation}

A "fake friend" might be:
- Someone who doesn't engage meaningfully
- Bot or spam account
- One-sided relationship (you always initiate)
- No genuine connection or interaction quality

Provide:
1. Is this likely a fake friend? (yes/no/maybe)
2. Confidence score (0-100)
3. Key indicators supporting the assessment
4. Recommendation (keep/review/unfollow)

Format as JSON.`,
};

/**
 * Rate limiting configuration for AI API calls
 */
export const rateLimits = {
	ollama: {
		requestsPerMinute: 60, // Local, can be higher
		concurrentRequests: 5,
	},
	openai: {
		requestsPerMinute: 3, // Conservative to avoid costs
		concurrentRequests: 1,
	},
	anthropic: {
		requestsPerMinute: 5,
		concurrentRequests: 1,
	},
};

/**
 * Feature flags for AI capabilities
 */
export const aiFeatures = {
	sentimentAnalysis: false, // Enable AI sentiment analysis
	relationshipScoring: false, // Enable AI relationship strength scoring
	conversationInsights: false, // Enable AI conversation insights
	fakeFriendDetection: false, // Enable AI-powered fake friend detection
	batchProcessing: false, // Enable batch analysis of multiple users
};

/**
 * Privacy and data handling settings
 */
export const privacySettings = {
	// When true, message content is not sent to AI services
	// Only metadata (timestamps, counts, etc.) is used
	metadataOnly: true,

	// Anonymize usernames before sending to AI
	anonymizeUsernames: true,

	// Maximum number of messages to send per analysis
	maxMessagesPerAnalysis: 50,

	// Delete AI analysis results after X days
	retentionDays: 30,
};

/**
 * Helper function to check if AI features are available
 */
export function isAIEnabled(): boolean {
	return (
		(ollamaConfig.enabled || mastraConfig.enabled) &&
		Object.values(aiFeatures).some(Boolean)
	);
}

/**
 * Helper function to get active AI provider
 */
export function getActiveProvider(): 'ollama' | 'mastra' | 'none' {
	if (ollamaConfig.enabled) return 'ollama';
	if (mastraConfig.enabled) return 'mastra';
	return 'none';
}

/**
 * FUTURE: Initialize AI service connection
 * This will be implemented when AI features are enabled
 */
export async function initializeAIService(): Promise<boolean> {
	const provider = getActiveProvider();

	if (provider === 'none') {
		return false;
	}

	// TODO: Implement initialization logic for each provider
	// - Ollama: Test connection to local endpoint
	// - Mastra: Initialize agent with API keys
	// - Verify model availability

	return false; // Not yet implemented
}

/**
 * FUTURE: Test AI service connection
 */
export async function testAIConnection(): Promise<{
	connected: boolean;
	provider: string;
	model: string;
	latencyMs: number;
}> {
	// TODO: Implement connection test
	return {
		connected: false,
		provider: getActiveProvider(),
		model: ollamaConfig.model,
		latencyMs: 0,
	};
}
