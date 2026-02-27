# Phase 6: AI Brain 🧠

## Overview

Phase 6 adds the core AI intelligence to Quinn, enabling natural language understanding, intelligent suggestions, and automated task execution. This is what transforms Quinn from a CRUD app into a true AI assistant.

**Status:** 📋 Planned  
**Estimated Duration:** 4-6 weeks

---

## Goals

1. Integrate LLM (OpenAI/Anthropic) for natural language processing
2. Build conversation/chat interface
3. Implement context management and memory
4. Create intelligent action suggestions
5. Enable AI-powered email drafting
6. Add learning from user preferences

---

## Features

### 6.1 LLM Integration

**Objective:** Connect to OpenAI GPT-4 or Anthropic Claude for AI capabilities

**Backend Components:**

```typescript
// backend/src/lib/ai.ts
interface AIService {
  // Chat completion
  chat(messages: Message[], options?: ChatOptions): Promise<string>;

  // Streaming chat
  streamChat(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;

  // Function calling
  chatWithFunctions(messages: Message[], functions: Function[]): Promise<FunctionCall | string>;

  // Embeddings for semantic search
  getEmbeddings(text: string): Promise<number[]>;
}
```

**Tasks:**

- [ ] Create AI service library
- [ ] Implement OpenAI integration
- [ ] Implement Anthropic integration (fallback)
- [ ] Add streaming support
- [ ] Implement function calling
- [ ] Add rate limiting and error handling
- [ ] Store API keys in Secrets Manager

### 6.2 Chat Interface

**Objective:** Build a conversational interface for interacting with Quinn

**Frontend Components:**

```typescript
// Chat page with message history
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actions?: SuggestedAction[];
}

// Chat input with voice support
interface ChatInput {
  text: string;
  attachments?: File[];
  voiceEnabled: boolean;
}
```

**Tasks:**

- [ ] Create Chat page
- [ ] Build message list component
- [ ] Implement chat input with send
- [ ] Add typing indicators
- [ ] Support markdown rendering
- [ ] Add code syntax highlighting
- [ ] Implement message history persistence

### 6.3 Context Management

**Objective:** Maintain conversation context and user memory

**Backend Components:**

```typescript
// backend/src/adapters/conversations.ts
interface ConversationAdapter {
  createConversation(userId: string): Promise<Conversation>;
  getConversation(userId: string, conversationId: string): Promise<Conversation>;
  addMessage(conversationId: string, message: Message): Promise<void>;
  getRecentMessages(conversationId: string, limit: number): Promise<Message[]>;
}

// Context builder
interface ContextBuilder {
  buildContext(userId: string, conversationId: string): Promise<SystemPrompt>;
  getUserContext(userId: string): Promise<UserContext>;
  getRelevantData(userId: string, query: string): Promise<RelevantData>;
}
```

**Tasks:**

- [ ] Create conversation adapter
- [ ] Implement context builder
- [ ] Add user preference injection
- [ ] Implement relevant data retrieval
- [ ] Add conversation summarization
- [ ] Implement memory management (sliding window)

### 6.4 Intelligent Actions

**Objective:** AI suggests and creates actions based on conversation

**Backend Components:**

```typescript
// Action suggestion system
interface ActionSuggester {
  // Analyze conversation and suggest actions
  suggestActions(conversation: Conversation): Promise<SuggestedAction[]>;

  // Create action from natural language
  createActionFromNL(userId: string, request: string): Promise<Action>;

  // Execute action with AI assistance
  executeWithAI(action: Action): Promise<ActionResult>;
}

interface SuggestedAction {
  type: ActionType;
  title: string;
  description: string;
  confidence: number;
  parameters: Record<string, any>;
}
```

**Tasks:**

- [ ] Create action suggester service
- [ ] Implement NL to action conversion
- [ ] Add confidence scoring
- [ ] Create action preview UI
- [ ] Implement one-click action creation

### 6.5 AI Email Drafting

**Objective:** Generate email drafts in the user's voice

**Backend Components:**

```typescript
// Email AI service
interface EmailAIService {
  // Generate reply to email
  generateReply(email: Email, instructions?: string): Promise<EmailDraft>;

  // Generate new email
  generateEmail(prompt: string, context: UserContext): Promise<EmailDraft>;

  // Improve existing draft
  improveDraft(draft: EmailDraft, feedback: string): Promise<EmailDraft>;

  // Learn user's writing style
  analyzeWritingStyle(emails: Email[]): Promise<WritingStyle>;
}
```

**Tasks:**

- [ ] Create email AI service
- [ ] Implement reply generation
- [ ] Implement new email generation
- [ ] Add writing style learning
- [ ] Create draft improvement flow
- [ ] Add tone adjustment options

### 6.6 Learning & Personalization

**Objective:** Quinn learns from user behavior and preferences

**Backend Components:**

```typescript
// Learning service
interface LearningService {
  // Record user feedback
  recordFeedback(userId: string, feedback: Feedback): Promise<void>;

  // Update user preferences from behavior
  updatePreferences(userId: string, behavior: UserBehavior): Promise<void>;

  // Get personalized suggestions
  getPersonalizedSuggestions(userId: string): Promise<Suggestion[]>;
}
```

**Tasks:**

- [ ] Create learning service
- [ ] Implement feedback recording
- [ ] Add preference inference
- [ ] Create suggestion engine
- [ ] Implement A/B testing framework

---

## API Endpoints

### Chat

```
POST   /chat                      # Send message, get response
GET    /chat/conversations        # List conversations
GET    /chat/conversations/:id    # Get conversation
DELETE /chat/conversations/:id    # Delete conversation
POST   /chat/conversations/:id/messages  # Add message
```

### AI Actions

```
POST   /ai/suggest-actions        # Get action suggestions
POST   /ai/create-action          # Create action from NL
POST   /ai/email/draft            # Generate email draft
POST   /ai/email/improve          # Improve draft
```

---

## Data Models

### Conversation

```typescript
interface Conversation {
  pk: string; // USER#<userId>
  sk: string; // CONVERSATION#<conversationId>
  conversationId: string;
  userId: string;
  title?: string;
  messages: Message[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Message

```typescript
interface Message {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  functionCall?: FunctionCall;
  suggestedActions?: SuggestedAction[];
  timestamp: string;
}
```

---

## Technical Considerations

### LLM Selection

- **Primary:** OpenAI GPT-4 Turbo (best for function calling)
- **Fallback:** Anthropic Claude 3 (better for long context)
- **Cost optimization:** GPT-3.5 for simple tasks

### Context Window Management

- Use sliding window for long conversations
- Summarize old messages
- Inject relevant user data dynamically

### Security

- Never expose API keys to frontend
- Sanitize user input before sending to LLM
- Implement content filtering
- Rate limit per user

### Cost Management

- Track token usage per user
- Implement usage limits
- Cache common responses
- Use cheaper models for simple tasks

---

## Success Criteria

- [ ] Users can chat naturally with Quinn
- [ ] AI suggests relevant actions
- [ ] Email drafts match user's writing style
- [ ] Context is maintained across conversations
- [ ] Response time < 3 seconds
- [ ] Cost per user < $1/month average

---

## Dependencies

- OpenAI API key
- Anthropic API key (optional)
- AWS Secrets Manager for key storage
- Increased Lambda memory (512MB+)
- Streaming support in API Gateway

---

## Risks & Mitigations

| Risk            | Mitigation                           |
| --------------- | ------------------------------------ |
| High API costs  | Implement usage limits, caching      |
| Slow responses  | Use streaming, optimize prompts      |
| Hallucinations  | Add fact-checking, user confirmation |
| Context limits  | Implement summarization              |
| Security issues | Input sanitization, output filtering |
