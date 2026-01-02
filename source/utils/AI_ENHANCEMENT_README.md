# AI-Enhanced Relationship Analysis (Future Feature)

This directory contains scaffolding for future AI-powered relationship analysis features using services like Ollama and Mastra AI.

## Overview

The AI enhancement will provide deeper insights into social relationships by analyzing:

- **Conversation patterns**: Message frequency, response times, initiation balance
- **Sentiment analysis**: Emotional tone and engagement quality
- **Relationship strength**: Multi-factor scoring of connection quality
- **Fake friend detection**: AI-powered identification of superficial connections

## Architecture

### Core Files

1. **`ai-analysis.ts`** - Analysis algorithms and utilities
   - Conversation pattern analysis
   - Sentiment analysis (placeholder for AI)
   - Relationship strength calculation
   - Batch processing capabilities

2. **`ai-config.ts`** - Configuration and setup
   - Ollama integration settings
   - Mastra AI configuration
   - Privacy and rate limiting settings
   - Feature flags

### AI Service Options

#### Option 1: Ollama (Recommended for Privacy)

- **Pros**: Local, private, free, fast
- **Cons**: Requires local installation and model downloads
- **Best for**: Users concerned about privacy
- **Setup**:

  ```bash
  # Install Ollama
  curl -fsSL https://ollama.ai/install.sh | sh

  # Pull a model
  ollama pull llama2

  # Start server
  ollama serve
  ```

#### Option 2: Mastra AI

- **Pros**: Multi-provider support, agent workflows, managed service
- **Cons**: Requires API keys and may incur costs
- **Best for**: Users wanting managed AI services
- **Setup**:
  ```bash
  npm install @mastra/core
  export MASTRA_API_KEY=your_key_here
  ```

## Planned Features

### Phase 1: Basic Pattern Analysis (Current)

- ✅ Message counting and frequency
- ✅ Response time calculation
- ✅ Initiation ratio tracking
- ✅ Last interaction tracking

### Phase 2: AI Integration (Future)

- ⏳ Ollama local LLM integration
- ⏳ Mastra AI agent setup
- ⏳ Prompt engineering for relationship analysis
- ⏳ Rate limiting and error handling

### Phase 3: Advanced Analysis (Future)

- ⏳ Sentiment analysis of message content
- ⏳ Emotional depth scoring
- ⏳ Conversation quality metrics
- ⏳ Balance and reciprocity analysis

### Phase 4: AI-Powered Fake Friend Detection (Future)

- ⏳ Context-aware relationship evaluation
- ⏳ Bot detection through behavioral patterns
- ⏳ One-sided relationship identification
- ⏳ Personalized recommendations

## Usage Example (Future)

```typescript
import {analyzeRelationshipWithAI} from './utils/ai-analysis.js';
import {ollamaConfig} from './utils/ai-config.js';

// Analyze a relationship with AI
const analysis = await analyzeRelationshipWithAI(
	userId,
	username,
	messages,
	currentUserId,
	{
		provider: 'ollama',
		model: 'llama2',
		endpoint: ollamaConfig.endpoint,
	},
);

console.log(
	`Relationship strength: ${analysis.relationshipStrength.score}/100`,
);
console.log(`Classification: ${analysis.relationshipStrength.classification}`);
console.log(`Recommendations:`, analysis.recommendations);
```

## Privacy Considerations

The AI analysis is designed with privacy in mind:

1. **Local Processing**: Ollama runs entirely locally
2. **Metadata Only**: Can be configured to send only timestamps/counts, not message content
3. **Anonymization**: Usernames can be anonymized before AI processing
4. **Data Retention**: Analysis results can be auto-deleted after X days
5. **No Cloud Storage**: No conversation data stored in cloud services

## Configuration

Enable AI features by editing `ai-config.ts`:

```typescript
export const aiFeatures = {
	sentimentAnalysis: true, // Enable AI sentiment analysis
	relationshipScoring: true, // Enable AI relationship strength scoring
	conversationInsights: true, // Enable AI conversation insights
	fakeFriendDetection: true, // Enable AI-powered fake friend detection
	batchProcessing: true, // Enable batch analysis
};

export const ollamaConfig = {
	enabled: true,
	endpoint: 'http://localhost:11434',
	model: 'llama2',
};
```

## Integration Points

The AI analysis will integrate with existing features:

1. **Follower Analysis**: Enhanced fake friend detection
2. **Chat Commands**: AI-powered conversation insights
3. **Export Features**: Include AI analysis in JSON exports
4. **Notifications**: AI-driven relationship health alerts

## Development Roadmap

1. **Q1 2026**: Basic Ollama integration and sentiment analysis
2. **Q2 2026**: Mastra AI agent workflows and batch processing
3. **Q3 2026**: Advanced fake friend detection with AI
4. **Q4 2026**: Personalized relationship recommendations

## Contributing

When implementing AI features:

1. Maintain privacy-first approach
2. Make AI features opt-in
3. Provide clear documentation
4. Test with various models and providers
5. Handle API errors gracefully
6. Implement proper rate limiting

## Dependencies (Future)

Will require:

- `@mastra/core` - For Mastra AI integration
- `axios` or `fetch` - For Ollama API calls
- Environment variables for API keys

## Testing

Test files will be added in `tests/ai-analysis.test.ts`:

- Unit tests for pattern analysis
- Mock tests for AI calls
- Integration tests with local Ollama
- Edge case handling

## License

Same as parent project (MIT License)
