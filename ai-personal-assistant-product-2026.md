# AI Personal Assistant Product Specification

## Product Vision

**An AI that actually DOES things for you, not just suggests.**

Unlike existing AI assistants that just answer questions, this PA:

- Makes phone calls on your behalf
- Drafts and sends emails
- Orders food and groceries
- Manages a dedicated spending account
- Plans your budget and finances
- Organizes your social life
- All with human oversight and approval

---

## The Problem

**Current AI assistants are passive:**

- Siri/Alexa: Answer questions, set timers
- ChatGPT: Generate text, answer questions
- Notion AI: Help write documents

**What people actually need:**

- Someone to DO the tasks, not just help with them
- A real personal assistant, but affordable
- Automation with human control

**The gap:**

- Human PA: £30-50K/year salary
- AI assistants: Can't actually do anything
- **Our product: AI PA that acts, for £50/month**

---

## Product Name Ideas

### Naming Criteria

- **Non-gendered** - No "assistant" or gendered terms
- **Action-oriented** - Implies doing, not just helping
- **Memorable** - Easy to say and remember
- **Domain available** - .ai or .com

### Name Options

| Name         | Tagline                   | Domain      | Notes                   |
| ------------ | ------------------------- | ----------- | ----------------------- |
| **Handled**  | "Consider it handled"     | handled.ai  | Action-focused, neutral |
| **Sorted**   | "Your life, sorted"       | sorted.ai   | British, friendly       |
| **Offload**  | "Offload your life admin" | offload.ai  | Clear value prop        |
| **Relay**    | "Your AI relay"           | relay.ai    | Implies action transfer |
| **Dispatch** | "Life admin, dispatched"  | dispatch.ai | Action-oriented         |
| **Runbook**  | "Your life's runbook"     | runbook.ai  | Systematic, neutral     |
| **Tasked**   | "Consider it tasked"      | tasked.ai   | Action-focused          |
| **Covered**  | "You're covered"          | covered.ai  | Reassuring, neutral     |
| **Sidekick** | "Your AI sidekick"        | sidekick.ai | Friendly, non-gendered  |
| **Orbit**    | "Your life in orbit"      | orbit.ai    | Modern, neutral         |

**Recommended: Handled, Sorted, or Relay**

---

## Multi-Channel Interaction

### Interaction Channels

Users can interact with the AI through multiple channels:

| Channel                   | Use Case              | Features                          |
| ------------------------- | --------------------- | --------------------------------- |
| **Mobile App**            | Primary interface     | Full control, approvals, settings |
| **Phone Call**            | Hands-free, on-the-go | Call the AI, voice commands       |
| **Text/SMS**              | Quick requests        | Text commands, quick approvals    |
| **WhatsApp**              | Familiar interface    | Chat-based interaction            |
| **Voice (Smart Speaker)** | Home use              | Alexa/Google integration          |
| **Web App**               | Desktop use           | Full dashboard, settings          |
| **Email**                 | Async requests        | Email commands, reports           |

### Phone Call Interaction

**Call your AI anytime:**

- Dedicated phone number for your AI
- Call to make requests ("Book me a table for tonight")
- Call to check status ("What's on my calendar?")
- Call to approve actions ("Yes, send that email")

**AI calls you:**

- For urgent approvals
- Daily briefing (optional)
- Reminders and alerts

### Voice Customization

**Choose your AI's voice:**

| Voice Option  | Description                            |
| ------------- | -------------------------------------- |
| **Neutral 1** | Clear, professional, neutral accent    |
| **Neutral 2** | Warm, friendly, neutral accent         |
| **British**   | British English, professional          |
| **American**  | American English, professional         |
| **Custom**    | Upload voice sample to clone (premium) |

**Voice settings:**

- Speed (slow, normal, fast)
- Tone (formal, casual, friendly)
- Language (English, Spanish, French, etc.)

### Text/SMS Interaction

**Quick commands via text:**

```
You: "Order groceries"
AI: "I've prepared your usual order from Ocado. £67.50. Delivery tomorrow 2-3pm. Approve? Reply Y/N"
You: "Y"
AI: "Done. Order confirmed."
```

**Approval via text:**

```
AI: "Email draft ready for John Smith re: Meeting follow-up. Reply SEND, EDIT, or SKIP"
You: "SEND"
AI: "Sent."
```

### App Interaction

**Full control in the app:**

- Dashboard with pending actions
- Approval queue
- Settings and preferences
- History and analytics
- Voice/text chat interface

---

## Core Capabilities

### 1. COMMUNICATION (Emails & Calls)

#### Email Management

**What it does:**

- Reads and categorizes all emails
- Drafts responses in your voice
- Sends emails on your behalf (with approval)
- Follows up automatically
- Unsubscribes from junk

**User control:**

- Review drafts before sending
- Set rules (auto-send for certain types)
- Approve/edit/reject each response
- Train on your writing style

**Technical requirements:**

- Gmail/Outlook integration (OAuth)
- NLP for email understanding
- Style learning from past emails
- Approval workflow

#### Phone Calls

**What it does:**

- Makes calls on your behalf
- Books appointments (doctor, dentist, restaurant)
- Handles customer service calls
- Negotiates bills (internet, insurance)
- Follows up on orders/deliveries

**User control:**

- Approve call before it's made
- Provide context/instructions
- Listen to recording after
- Set boundaries (what it can/can't agree to)

**Technical requirements:**

- Voice synthesis (natural sounding)
- Speech recognition
- Call recording and transcription
- Integration with phone system (Twilio)

---

### 2. FOOD & EATING

#### Meal Planning

**What it does:**

- Plans weekly meals based on preferences
- Considers budget, dietary needs, schedule
- Suggests recipes
- Accounts for leftovers

**User control:**

- Set dietary preferences/restrictions
- Set weekly food budget
- Approve/modify meal plan
- Rate meals for learning

#### Grocery Shopping

**What it does:**

- Creates shopping list from meal plan
- Orders groceries automatically
- Finds best prices across stores
- Schedules delivery around your calendar

**User control:**

- Approve order before placing
- Set preferred stores
- Set budget limits
- Substitute preferences

#### Food Ordering

**What it does:**

- Orders takeaway/delivery
- Knows your favorites
- Considers budget and timing
- Handles dietary requirements

**User control:**

- Approve each order
- Set spending limits
- Blacklist/whitelist restaurants

**Technical requirements:**

- Integration with grocery delivery (Ocado, Tesco, Amazon Fresh)
- Integration with food delivery (Deliveroo, Uber Eats, Just Eat)
- Recipe database
- Nutrition tracking

---

### 3. FINANCES & BUDGET

#### Dedicated Spending Account

**What it does:**

- Connects to a dedicated bank account (you fund it)
- Uses this account for all purchases
- Never touches your main accounts
- Provides complete transparency

**How it works:**

1. User opens a dedicated account (Monzo, Revolut, etc.)
2. User funds it monthly (e.g., £500/month)
3. AI only spends from this account
4. User sees all transactions in real-time
5. AI can't exceed balance

**User control:**

- Set monthly funding amount
- Set per-transaction limits
- Approve large purchases
- Pause spending anytime

#### Budget Management

**What it does:**

- Tracks all spending (AI account + main accounts)
- Categorizes transactions automatically
- Creates and monitors budgets
- Alerts on overspending
- Suggests savings opportunities

**User control:**

- Set budget categories and limits
- Review weekly/monthly reports
- Adjust budgets anytime

#### Bill Management

**What it does:**

- Tracks all recurring bills
- Reminds before due dates
- Negotiates better rates (via calls)
- Switches providers when beneficial
- Pays bills from dedicated account

**User control:**

- Approve any provider switches
- Set auto-pay rules
- Review negotiation results

**Technical requirements:**

- Open Banking integration (Plaid, TrueLayer)
- Bank account connection (read-only for main accounts)
- Spending account integration (Monzo, Revolut API)
- Bill tracking and categorization

---

### 4. SOCIAL & RELATIONSHIPS

#### Date Night Planning

**What it does:**

- Suggests date ideas based on budget
- Books restaurants/activities
- Considers preferences and history
- Plans special occasions (anniversaries, birthdays)

**User control:**

- Set date night budget
- Approve plans before booking
- Rate experiences for learning
- Set frequency preferences

#### Social Calendar

**What it does:**

- Tracks friends and family
- Reminds to stay in touch
- Suggests meetup ideas
- Coordinates schedules
- Sends birthday/anniversary messages

**User control:**

- Set relationship priorities
- Approve messages before sending
- Set contact frequency goals

#### Gift Planning

**What it does:**

- Tracks important dates (birthdays, anniversaries)
- Suggests gifts based on budget and preferences
- Orders and ships gifts
- Sends cards

**User control:**

- Set gift budgets per person
- Approve gifts before ordering
- Add gift ideas/preferences

**Technical requirements:**

- Calendar integration
- Restaurant booking APIs (OpenTable, Resy)
- Event discovery APIs
- Gift shopping integration (Amazon, etc.)

---

### 5. DAILY LIFE ADMIN

#### Appointments & Bookings

**What it does:**

- Books doctor/dentist appointments
- Schedules car services
- Arranges home repairs
- Manages subscriptions

**User control:**

- Approve all bookings
- Set preferred providers
- Set scheduling preferences

#### Travel Planning

**What it does:**

- Researches and books flights
- Books hotels
- Plans itineraries
- Manages travel documents
- Handles changes/cancellations

**User control:**

- Set travel budget
- Approve all bookings
- Set preferences (airlines, hotels, etc.)

#### Home Management

**What it does:**

- Orders household supplies
- Schedules cleaning services
- Manages repairs and maintenance
- Tracks warranties

**User control:**

- Approve all orders/bookings
- Set spending limits
- Set preferred providers

---

## User Control & Approval System

### The "Tweak Everything" Philosophy

**Every action has three modes:**

1. **Suggest Only** - AI suggests, user must approve
2. **Auto with Review** - AI acts, user can undo within X hours
3. **Full Auto** - AI acts autonomously within rules

**User sets mode per category:**

| Category       | Default Mode     | User Can Change To |
| -------------- | ---------------- | ------------------ |
| Email drafts   | Suggest Only     | Auto with Review   |
| Email sending  | Suggest Only     | Auto with Review   |
| Phone calls    | Suggest Only     | Suggest Only       |
| Grocery orders | Suggest Only     | Auto with Review   |
| Food delivery  | Suggest Only     | Auto with Review   |
| Bill payments  | Auto with Review | Full Auto          |
| Date planning  | Suggest Only     | Auto with Review   |
| Gift ordering  | Suggest Only     | Auto with Review   |

### Approval Workflow

**For each action:**

1. AI prepares action
2. User receives notification (app, email, SMS)
3. User can: Approve / Edit / Reject / Snooze
4. If no response within X hours: Follow default rule
5. AI learns from edits

### Spending Controls

**Hard limits:**

- Per-transaction maximum
- Daily spending limit
- Category limits
- Monthly total limit

**Soft limits:**

- Alerts when approaching limits
- Require approval above threshold
- Weekly spending reports

---

## Technical Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│  (Mobile App, Web App, Voice Interface, Notifications)       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL ENGINE                           │
│  (Action queue, User preferences, Approval workflow)         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      AI BRAIN                                │
│  (LLM, Context management, Learning, Decision making)        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   ACTION EXECUTORS                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Email  │ │  Phone  │ │ Shopping│ │ Banking │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Calendar │ │ Travel  │ │  Food   │ │ Social  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS                              │
│  Gmail, Outlook, Twilio, Plaid, Deliveroo, Amazon, etc.     │
└─────────────────────────────────────────────────────────────┘
```

### Key Integrations

| Category             | Integrations                       |
| -------------------- | ---------------------------------- |
| **Email**            | Gmail API, Outlook API             |
| **Phone**            | Twilio, Vonage                     |
| **Banking**          | Plaid, TrueLayer, Open Banking     |
| **Spending Account** | Monzo API, Revolut API             |
| **Groceries**        | Ocado, Tesco, Amazon Fresh         |
| **Food Delivery**    | Deliveroo, Uber Eats, Just Eat     |
| **Calendar**         | Google Calendar, Outlook Calendar  |
| **Travel**           | Skyscanner, Booking.com, Trainline |
| **Restaurants**      | OpenTable, Resy, TheFork           |
| **Shopping**         | Amazon, eBay                       |

### Security & Privacy

**Data protection:**

- All data encrypted at rest and in transit
- User owns their data
- GDPR compliant
- SOC 2 certification (target)

**Financial security:**

- Read-only access to main bank accounts
- Spending only from dedicated account
- Transaction limits enforced
- Audit trail for all actions

**Access control:**

- 2FA required
- Biometric authentication option
- Session management
- Activity logging

---

## Pricing Model

### Tiered Pricing

| Tier        | Price     | Features                                   |
| ----------- | --------- | ------------------------------------------ |
| **Starter** | £15/month | Email management, basic planning           |
| **Pro**     | £35/month | + Phone calls, food ordering, budgeting    |
| **Premium** | £50/month | + Full automation, travel, social planning |
| **Family**  | £75/month | Premium for up to 4 people                 |

### Usage-Based Add-ons

| Add-on                 | Price      |
| ---------------------- | ---------- |
| Additional phone calls | £0.50/call |
| International calls    | £1-5/call  |
| Premium travel booking | £5/booking |

### Why This Pricing Works

- **Human PA cost**: £30-50K/year = £2,500-4,000/month
- **Our cost**: £50/month = 1-2% of human PA
- **Value delivered**: 10-20 hours/month saved
- **ROI**: £50 for 10 hours = £5/hour (vs £15-25/hour for human)

---

## MVP Roadmap

### Phase 1: Foundation (Weeks 1-8)

**Core infrastructure:**

- User authentication and onboarding
- Approval workflow engine
- Notification system
- Basic mobile app

**First capability: Email**

- Gmail/Outlook integration
- Email categorization
- Draft responses
- Approval workflow

**Deliverable**: Email management with approval workflow

---

### Phase 2: Communication (Weeks 9-14)

**Phone calls:**

- Twilio integration
- Voice synthesis
- Call scripting
- Recording and transcription

**Email automation:**

- Auto-send for approved categories
- Follow-up automation
- Unsubscribe automation

**Deliverable**: Full communication management

---

### Phase 3: Money (Weeks 15-20)

**Banking integration:**

- Open Banking connection
- Transaction categorization
- Budget tracking

**Spending account:**

- Monzo/Revolut integration
- Spending controls
- Transaction approval

**Deliverable**: Budget management + spending account

---

### Phase 4: Food (Weeks 21-26)

**Meal planning:**

- Recipe database
- Meal plan generation
- Dietary preferences

**Grocery ordering:**

- Supermarket integrations
- Order automation
- Delivery scheduling

**Food delivery:**

- Deliveroo/Uber Eats integration
- Order automation

**Deliverable**: Complete food management

---

### Phase 5: Life (Weeks 27-32)

**Social planning:**

- Date night suggestions
- Restaurant booking
- Event discovery

**Appointments:**

- Booking automation
- Calendar management

**Travel:**

- Flight/hotel search
- Booking automation

**Deliverable**: Full life management

---

## Competitive Analysis

### Existing Solutions

| Competitor      | What They Do                    | Gap                      |
| --------------- | ------------------------------- | ------------------------ |
| **Siri/Alexa**  | Voice commands, basic tasks     | Can't actually do things |
| **ChatGPT**     | Answer questions, generate text | No action capability     |
| **Superhuman**  | Email management                | Email only, no actions   |
| **Fyxer**       | Email drafting                  | Email only               |
| **YNAB**        | Budgeting                       | Manual, no automation    |
| **Mint**        | Finance tracking                | Passive, no actions      |
| **Fancy Hands** | Human assistants                | Expensive, slow          |
| **Magic**       | Human + AI assistants           | Expensive ($100+/month)  |

### Our Differentiation

1. **Actually does things** - Not just suggestions
2. **Affordable** - £50/month vs £100+ for competitors
3. **Full control** - Approve everything, tweak anything
4. **Dedicated spending** - Safe, transparent financial access
5. **Comprehensive** - Email, calls, food, money, social
6. **Learning** - Gets better over time

---

## Risk Analysis

### Technical Risks

| Risk                    | Mitigation                                 |
| ----------------------- | ------------------------------------------ |
| Phone call quality      | Start with simple calls, improve over time |
| Integration reliability | Multiple providers per category            |
| AI mistakes             | Approval workflow, undo capability         |
| Security breach         | SOC 2, encryption, limited access          |

### Business Risks

| Risk                   | Mitigation                                 |
| ---------------------- | ------------------------------------------ |
| User trust             | Transparent actions, full control          |
| Regulatory (financial) | Partner with regulated entities            |
| Competition            | Move fast, build integrations moat         |
| Unit economics         | Usage-based pricing for expensive features |

### User Adoption Risks

| Risk             | Mitigation                       |
| ---------------- | -------------------------------- |
| Too complex      | Gradual onboarding, start simple |
| Trust issues     | Start with low-risk actions      |
| Approval fatigue | Smart defaults, learning         |

---

## Success Metrics

### User Metrics

| Metric                    | Target (Year 1) |
| ------------------------- | --------------- |
| Monthly Active Users      | 10,000          |
| Daily Active Users        | 5,000           |
| Actions per user/month    | 50+             |
| Approval rate             | 80%+            |
| Time saved per user/month | 10+ hours       |

### Business Metrics

| Metric     | Target (Year 1) |
| ---------- | --------------- |
| MRR        | £500K           |
| Churn rate | <5%/month       |
| CAC        | <£50            |
| LTV        | >£500           |
| NPS        | >50             |

---

## Go-to-Market Strategy

### Target Users

**Primary**: Busy professionals (25-45)

- High income, low time
- Already use productivity tools
- Willing to pay for convenience

**Secondary**: Families

- Dual income, kids
- Lots of life admin
- Value time with family

### Launch Strategy

1. **Waitlist** - Build anticipation
2. **Beta** - 500 users, iterate fast
3. **Launch** - Product Hunt, press
4. **Growth** - Referrals, content marketing

### Positioning

**Not another AI assistant. An AI that actually does things.**

---

## Next Steps

1. [ ] Validate concept with 20 potential users
2. [ ] Design approval workflow UX
3. [ ] Build MVP (email + approval)
4. [ ] Test phone call capability
5. [ ] Partner with banking provider
6. [ ] Launch beta

---

## Update Log

| Date       | Update                        |
| ---------- | ----------------------------- |
| 2026-02-09 | Initial product specification |
