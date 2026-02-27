# Quinn AI - Financial Model

## Overview

This document provides detailed financial projections, assumptions, and sensitivity analysis for Quinn AI's seed funding round.

---

## Executive Financial Summary

| Metric            | Year 1  | Year 2 | Year 3 | Year 4 | Year 5  |
| ----------------- | ------- | ------ | ------ | ------ | ------- |
| **Users**         | 500     | 3,000  | 15,000 | 50,000 | 150,000 |
| **MRR**           | £25K    | £150K  | £750K  | £2.5M  | £7.5M   |
| **ARR**           | £300K   | £1.8M  | £9M    | £30M   | £90M    |
| **Gross Margin**  | 80%     | 80%    | 80%    | 82%    | 85%     |
| **EBITDA**        | (£160K) | £340K  | £3.2M  | £13.1M | £47.5M  |
| **Cash Position** | £340K   | £680K  | £3.9M  | £17M   | £64.5M  |

---

## Revenue Model

### Pricing Structure

| Tier             | Monthly | Annual | Discount   | Target Segment         |
| ---------------- | ------- | ------ | ---------- | ---------------------- |
| **Starter**      | £29     | £290   | 17%        | Tech-savvy millennials |
| **Professional** | £79     | £790   | 17%        | Busy professionals     |
| **Premium**      | £149    | £1,490 | 17%        | High-net-worth         |
| **Enterprise**   | Custom  | Custom | Negotiated | Teams/Businesses       |

### Revenue Mix Assumptions

| Tier             | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| ---------------- | ------ | ------ | ------ | ------ | ------ |
| **Starter**      | 40%    | 35%    | 30%    | 25%    | 20%    |
| **Professional** | 50%    | 50%    | 50%    | 50%    | 50%    |
| **Premium**      | 10%    | 12%    | 15%    | 18%    | 22%    |
| **Enterprise**   | 0%     | 3%     | 5%     | 7%     | 8%     |

### Blended ARPU Calculation

| Year | Starter ARPU       | Pro ARPU           | Premium ARPU        | Enterprise ARPU | Blended ARPU |
| ---- | ------------------ | ------------------ | ------------------- | --------------- | ------------ |
| Y1   | £29 × 40% = £11.60 | £79 × 50% = £39.50 | £149 × 10% = £14.90 | £0              | **£66**      |
| Y2   | £29 × 35% = £10.15 | £79 × 50% = £39.50 | £149 × 12% = £17.88 | £200 × 3% = £6  | **£73**      |
| Y3   | £29 × 30% = £8.70  | £79 × 50% = £39.50 | £149 × 15% = £22.35 | £200 × 5% = £10 | **£81**      |
| Y4   | £29 × 25% = £7.25  | £79 × 50% = £39.50 | £149 × 18% = £26.82 | £200 × 7% = £14 | **£88**      |
| Y5   | £29 × 20% = £5.80  | £79 × 50% = £39.50 | £149 × 22% = £32.78 | £200 × 8% = £16 | **£94**      |

_Note: Using conservative £50 ARPU in main projections to account for discounts and churn_

---

## User Growth Model

### Growth Assumptions

| Metric             | Year 1 | Year 2 | Year 3 | Year 4 | Year 5  |
| ------------------ | ------ | ------ | ------ | ------ | ------- |
| **Starting Users** | 0      | 500    | 3,000  | 15,000 | 50,000  |
| **New Users**      | 650    | 3,100  | 14,500 | 42,500 | 115,000 |
| **Churned Users**  | 150    | 600    | 2,500  | 7,500  | 15,000  |
| **Ending Users**   | 500    | 3,000  | 15,000 | 50,000 | 150,000 |
| **Net Growth**     | 500    | 2,500  | 12,000 | 35,000 | 100,000 |
| **Growth Rate**    | N/A    | 500%   | 400%   | 233%   | 200%    |

### Monthly Churn Rate

| Year | Monthly Churn | Annual Churn | Rationale                           |
| ---- | ------------- | ------------ | ----------------------------------- |
| Y1   | 5%            | 46%          | Early product, finding PMF          |
| Y2   | 4%            | 39%          | Improved product, better onboarding |
| Y3   | 3.5%          | 35%          | Mature product, strong retention    |
| Y4   | 3%            | 31%          | Network effects, habit formation    |
| Y5   | 2.5%          | 26%          | Market leader, high switching costs |

### Customer Acquisition Channels

| Channel                    | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| -------------------------- | ------ | ------ | ------ | ------ | ------ |
| **Organic/SEO**            | 30%    | 25%    | 20%    | 15%    | 15%    |
| **Referral**               | 25%    | 30%    | 35%    | 35%    | 35%    |
| **Paid (Google/LinkedIn)** | 30%    | 30%    | 30%    | 35%    | 35%    |
| **Partnerships**           | 5%     | 10%    | 10%    | 10%    | 10%    |
| **PR/Press**               | 10%    | 5%     | 5%     | 5%     | 5%     |

---

## Cost Structure

### Cost of Revenue (COGS)

| Cost Item              | Per User/Month  | Year 1     | Year 2    | Year 3     | Year 4     | Year 5      |
| ---------------------- | --------------- | ---------- | --------- | ---------- | ---------- | ----------- |
| **AWS Infrastructure** | £5              | £30K       | £180K     | £900K      | £3M        | £9M         |
| **AI/LLM (Bedrock)**   | £3              | £18K       | £108K     | £540K      | £1.8M      | £5.4M       |
| **Payment Processing** | 2.5% of revenue | £7.5K      | £45K      | £225K      | £750K      | £2.25M      |
| **Customer Support**   | £2              | £12K       | £72K      | £360K      | £1.2M      | £3.6M       |
| **Total COGS**         |                 | **£67.5K** | **£405K** | **£2.03M** | **£6.75M** | **£20.25M** |
| **Gross Margin**       |                 | **78%**    | **78%**   | **77%**    | **78%**    | **78%**     |

_Note: Using 80% gross margin in main projections for conservatism_

### Operating Expenses

#### Engineering

| Role                       | Year 1    | Year 2    | Year 3    | Year 4     | Year 5     |
| -------------------------- | --------- | --------- | --------- | ---------- | ---------- |
| Founder (CEO/CTO)          | £80K      | £100K     | £120K     | £150K      | £200K      |
| Senior Full-Stack Engineer | £90K      | £95K      | £100K     | £105K      | £110K      |
| AI/ML Engineer             | -         | £100K     | £105K     | £110K      | £115K      |
| Additional Engineers       | -         | £90K      | £450K     | £1.2M      | £3M        |
| Engineering Tools          | £30K      | £50K      | £100K     | £200K      | £400K      |
| **Total Engineering**      | **£200K** | **£435K** | **£875K** | **£1.77M** | **£3.83M** |

#### Sales & Marketing

| Item                       | Year 1    | Year 2    | Year 3     | Year 4     | Year 5     |
| -------------------------- | --------- | --------- | ---------- | ---------- | ---------- |
| Growth Marketing Lead      | £80K      | £85K      | £90K       | £95K       | £100K      |
| Sales Lead                 | -         | £70K      | £75K       | £80K       | £85K       |
| Additional Marketing/Sales | -         | £50K      | £300K      | £800K      | £2M        |
| Paid Acquisition           | £30K      | £200K     | £800K      | £2.5M      | £6M        |
| Content/PR                 | £15K      | £50K      | £150K      | £400K      | £1M        |
| Events/Conferences         | -         | £20K      | £50K       | £100K      | £200K      |
| **Total S&M**              | **£125K** | **£475K** | **£1.47M** | **£3.98M** | **£9.39M** |

#### General & Administrative

| Item                | Year 1   | Year 2    | Year 3    | Year 4    | Year 5     |
| ------------------- | -------- | --------- | --------- | --------- | ---------- |
| Legal & Compliance  | £25K     | £50K      | £100K     | £200K     | £400K      |
| Accounting/Finance  | £15K     | £40K      | £80K      | £150K     | £300K      |
| Office/Remote Setup | £10K     | £30K      | £60K      | £120K     | £250K      |
| Insurance           | £5K      | £15K      | £30K      | £60K      | £120K      |
| Other G&A           | £20K     | £50K      | £100K     | £200K     | £400K      |
| **Total G&A**       | **£75K** | **£185K** | **£370K** | **£730K** | **£1.47M** |

### Total Operating Expenses

| Category          | Year 1    | Year 2    | Year 3     | Year 4     | Year 5      |
| ----------------- | --------- | --------- | ---------- | ---------- | ----------- |
| Engineering       | £200K     | £435K     | £875K      | £1.77M     | £3.83M      |
| Sales & Marketing | £125K     | £475K     | £1.47M     | £3.98M     | £9.39M      |
| G&A               | £75K      | £185K     | £370K      | £730K      | £1.47M      |
| **Total OpEx**    | **£400K** | **£1.1M** | **£2.72M** | **£6.48M** | **£14.69M** |

---

## Profit & Loss Statement

| Line Item         | Year 1  | Year 2  | Year 3   | Year 4   | Year 5    |
| ----------------- | ------- | ------- | -------- | -------- | --------- |
| **Revenue**       | £300K   | £1.8M   | £9M      | £30M     | £90M      |
| Cost of Revenue   | (£60K)  | (£360K) | (£1.8M)  | (£5.4M)  | (£13.5M)  |
| **Gross Profit**  | £240K   | £1.44M  | £7.2M    | £24.6M   | £76.5M    |
| **Gross Margin**  | 80%     | 80%     | 80%      | 82%      | 85%       |
|                   |         |         |          |          |           |
| Engineering       | (£200K) | (£435K) | (£875K)  | (£1.77M) | (£3.83M)  |
| Sales & Marketing | (£125K) | (£475K) | (£1.47M) | (£3.98M) | (£9.39M)  |
| G&A               | (£75K)  | (£185K) | (£370K)  | (£730K)  | (£1.47M)  |
| **Total OpEx**    | (£400K) | (£1.1M) | (£2.72M) | (£6.48M) | (£14.69M) |
|                   |         |         |          |          |           |
| **EBITDA**        | (£160K) | £340K   | £4.48M   | £18.12M  | £61.81M   |
| **EBITDA Margin** | -53%    | 19%     | 50%      | 60%      | 69%       |
|                   |         |         |          |          |           |
| D&A               | (£10K)  | (£20K)  | (£50K)   | (£100K)  | (£200K)   |
| **EBIT**          | (£170K) | £320K   | £4.43M   | £18.02M  | £61.61M   |
|                   |         |         |          |          |           |
| Interest          | £5K     | £10K    | £50K     | £200K    | £500K     |
| **EBT**           | (£165K) | £330K   | £4.48M   | £18.22M  | £62.11M   |
|                   |         |         |          |          |           |
| Tax (19%)         | £0      | (£63K)  | (£851K)  | (£3.46M) | (£11.8M)  |
| **Net Income**    | (£165K) | £267K   | £3.63M   | £14.76M  | £50.31M   |
| **Net Margin**    | -55%    | 15%     | 40%      | 49%      | 56%       |

---

## Cash Flow Statement

### Operating Cash Flow

| Item                       | Year 1  | Year 2 | Year 3 | Year 4  | Year 5  |
| -------------------------- | ------- | ------ | ------ | ------- | ------- |
| Net Income                 | (£165K) | £267K  | £3.63M | £14.76M | £50.31M |
| Add: D&A                   | £10K    | £20K   | £50K   | £100K   | £200K   |
| Changes in Working Capital | (£5K)   | (£20K) | (£50K) | (£100K) | (£200K) |
| **Operating Cash Flow**    | (£160K) | £267K  | £3.63M | £14.76M | £50.31M |

### Investing Cash Flow

| Item                    | Year 1 | Year 2 | Year 3  | Year 4  | Year 5  |
| ----------------------- | ------ | ------ | ------- | ------- | ------- |
| CapEx                   | (£20K) | (£50K) | (£100K) | (£200K) | (£400K) |
| **Investing Cash Flow** | (£20K) | (£50K) | (£100K) | (£200K) | (£400K) |

### Financing Cash Flow

| Item                    | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| ----------------------- | ------ | ------ | ------ | ------ | ------ |
| Seed Funding            | £500K  | -      | -      | -      | -      |
| Series A                | -      | -      | £5M    | -      | -      |
| **Financing Cash Flow** | £500K  | £0     | £5M    | £0     | £0     |

### Cash Position

| Item             | Year 1 | Year 2 | Year 3 | Year 4  | Year 5  |
| ---------------- | ------ | ------ | ------ | ------- | ------- |
| Opening Cash     | £0     | £320K  | £537K  | £9.07M  | £23.63M |
| Net Cash Flow    | £320K  | £217K  | £8.53M | £14.56M | £49.91M |
| **Closing Cash** | £320K  | £537K  | £9.07M | £23.63M | £73.54M |

---

## Unit Economics

### Customer Acquisition Cost (CAC)

| Metric        | Year 1 | Year 2 | Year 3 | Year 4 | Year 5  |
| ------------- | ------ | ------ | ------ | ------ | ------- |
| S&M Spend     | £125K  | £475K  | £1.47M | £3.98M | £9.39M  |
| New Customers | 650    | 3,100  | 14,500 | 42,500 | 115,000 |
| **CAC**       | £192   | £153   | £101   | £94    | £82     |

### Lifetime Value (LTV)

| Metric                     | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| -------------------------- | ------ | ------ | ------ | ------ | ------ |
| ARPU (Monthly)             | £50    | £50    | £50    | £50    | £50    |
| Gross Margin               | 80%    | 80%    | 80%    | 82%    | 85%    |
| Monthly Churn              | 5%     | 4%     | 3.5%   | 3%     | 2.5%   |
| Customer Lifetime (months) | 20     | 25     | 29     | 33     | 40     |
| **LTV**                    | £800   | £1,000 | £1,160 | £1,353 | £1,700 |

### LTV:CAC Ratio

| Metric      | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| ----------- | ------ | ------ | ------ | ------ | ------ |
| LTV         | £800   | £1,000 | £1,160 | £1,353 | £1,700 |
| CAC         | £192   | £153   | £101   | £94    | £82    |
| **LTV:CAC** | 4.2:1  | 6.5:1  | 11.5:1 | 14.4:1 | 20.7:1 |

_Target: >3:1 is healthy, >5:1 is excellent_

### Payback Period

| Metric               | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
| -------------------- | ------ | ------ | ------ | ------ | ------ |
| CAC                  | £192   | £153   | £101   | £94    | £82    |
| Monthly Gross Profit | £40    | £40    | £40    | £41    | £43    |
| **Payback (months)** | 4.8    | 3.8    | 2.5    | 2.3    | 1.9    |

_Target: <12 months is healthy, <6 months is excellent_

---

## Sensitivity Analysis

### Revenue Sensitivity

| Scenario      | ARPU Change | User Growth Change | Year 5 ARR |
| ------------- | ----------- | ------------------ | ---------- |
| **Bear Case** | -20%        | -30%               | £50.4M     |
| **Base Case** | 0%          | 0%                 | £90M       |
| **Bull Case** | +20%        | +30%               | £140.4M    |

### Churn Sensitivity

| Monthly Churn | Year 5 Users | Year 5 ARR | Impact |
| ------------- | ------------ | ---------- | ------ |
| 4% (High)     | 100,000      | £60M       | -33%   |
| 2.5% (Base)   | 150,000      | £90M       | Base   |
| 1.5% (Low)    | 200,000      | £120M      | +33%   |

### CAC Sensitivity

| CAC         | Year 5 S&M Spend | Year 5 EBITDA | Impact |
| ----------- | ---------------- | ------------- | ------ |
| £120 (+50%) | £13.8M           | £57.4M        | -7%    |
| £82 (Base)  | £9.4M            | £61.8M        | Base   |
| £60 (-27%)  | £6.9M            | £64.3M        | +4%    |

---

## Funding Scenarios

### Seed Round (Current)

| Metric              | Value                  |
| ------------------- | ---------------------- |
| Amount              | £500,000               |
| Equity              | 15-20%                 |
| Pre-money Valuation | £2.5M - £3.3M          |
| Runway              | 18-24 months           |
| Target Milestone    | £150K MRR, 3,000 users |

### Series A (Projected - Year 3)

| Metric              | Value                          |
| ------------------- | ------------------------------ |
| Amount              | £5M - £10M                     |
| Equity              | 15-20%                         |
| Pre-money Valuation | £25M - £50M                    |
| Use of Funds        | US expansion, enterprise sales |
| Target Milestone    | £1M MRR, 20,000 users          |

### Series B (Projected - Year 4-5)

| Metric              | Value                  |
| ------------------- | ---------------------- |
| Amount              | £20M - £40M            |
| Equity              | 10-15%                 |
| Pre-money Valuation | £150M - £300M          |
| Use of Funds        | Global expansion, M&A  |
| Target Milestone    | £5M MRR, 100,000 users |

---

## Valuation Analysis

### Comparable Company Multiples

| Company     | ARR   | Valuation | Multiple |
| ----------- | ----- | --------- | -------- |
| Notion      | $250M | $10B      | 40x      |
| Monday.com  | $700M | $7B       | 10x      |
| Asana       | $600M | $3B       | 5x       |
| Calendly    | $100M | $3B       | 30x      |
| **Average** |       |           | **21x**  |

### Quinn Valuation Scenarios

| Scenario     | Year 5 ARR | Multiple | Valuation |
| ------------ | ---------- | -------- | --------- |
| Conservative | £50M       | 6x       | £300M     |
| Base         | £90M       | 8x       | £720M     |
| Optimistic   | £150M      | 12x      | £1.8B     |

### Investor Returns

| Scenario     | Exit Value | Seed Return (20%) | IRR  |
| ------------ | ---------- | ----------------- | ---- |
| Conservative | £300M      | £60M (120x)       | 78%  |
| Base         | £720M      | £144M (288x)      | 95%  |
| Optimistic   | £1.8B      | £360M (720x)      | 115% |

---

## Key Metrics Dashboard

### Monthly Tracking Metrics

| Metric           | Target Y1 | Target Y2 |
| ---------------- | --------- | --------- |
| MRR              | £25K      | £150K     |
| MRR Growth (MoM) | 15%       | 12%       |
| New Users        | 50/month  | 250/month |
| Churn Rate       | <5%       | <4%       |
| NPS              | >50       | >60       |
| CAC              | <£200     | <£150     |
| LTV:CAC          | >4:1      | >6:1      |

### Quarterly Board Metrics

| Metric       | Q1 Y1 | Q2 Y1 | Q3 Y1 | Q4 Y1 |
| ------------ | ----- | ----- | ----- | ----- |
| ARR          | £60K  | £120K | £200K | £300K |
| Users        | 100   | 200   | 350   | 500   |
| Gross Margin | 75%   | 78%   | 80%   | 80%   |
| Burn Rate    | £100K | £110K | £120K | £130K |
| Runway       | 20 mo | 17 mo | 14 mo | 12 mo |

---

## Assumptions Summary

### Revenue Assumptions

| Assumption            | Value      | Source/Rationale      |
| --------------------- | ---------- | --------------------- |
| Blended ARPU          | £50/month  | Conservative estimate |
| Annual price increase | 5%         | Inflation + features  |
| Enterprise ARPU       | £200/month | 2.5x Professional     |
| Free trial conversion | 5%         | Industry average      |

### Cost Assumptions

| Assumption            | Value    | Source/Rationale      |
| --------------------- | -------- | --------------------- |
| AWS cost per user     | £5/month | Serverless at scale   |
| AI cost per user      | £3/month | Bedrock token pricing |
| Payment processing    | 2.5%     | Stripe fees           |
| Support cost per user | £2/month | Scaled support team   |

### Growth Assumptions

| Assumption        | Value    | Source/Rationale        |
| ----------------- | -------- | ----------------------- |
| Viral coefficient | 1.2      | Each user refers 0.2    |
| Organic growth    | 20-30%   | SEO + content marketing |
| Paid CAC          | £100-150 | Google/LinkedIn ads     |
| Referral CAC      | £30-50   | Referral rewards        |

### Market Assumptions

| Assumption              | Value    | Source/Rationale      |
| ----------------------- | -------- | --------------------- |
| UK TAM                  | £2B      | Productivity software |
| Market growth           | 24% CAGR | Industry reports      |
| Achievable market share | 5%       | Conservative target   |
| US expansion            | Year 3   | Series A funding      |

---

## Risk Factors

### Financial Risks

| Risk                        | Probability | Impact | Mitigation               |
| --------------------------- | ----------- | ------ | ------------------------ |
| Higher churn than projected | Medium      | High   | Focus on onboarding, NPS |
| Lower conversion rate       | Medium      | Medium | A/B testing, freemium    |
| Higher CAC                  | Low         | Medium | Diversify channels       |
| Slower growth               | Medium      | High   | Pivot to B2B if needed   |

### Operational Risks

| Risk                 | Probability | Impact | Mitigation             |
| -------------------- | ----------- | ------ | ---------------------- |
| Hiring delays        | Medium      | Medium | Start recruiting early |
| Technical debt       | Low         | Medium | Code quality focus     |
| Integration failures | Low         | Medium | Multiple providers     |

---

## Conclusion

The financial model demonstrates:

1. **Strong unit economics**: LTV:CAC improving from 4.2:1 to 20.7:1
2. **Path to profitability**: EBITDA positive in Year 2
3. **Scalable model**: Gross margins of 80%+ sustainable
4. **Attractive returns**: 95%+ IRR in base case scenario

**Key success factors**:

- Achieve 5% free-to-paid conversion
- Maintain <4% monthly churn
- Keep CAC below £150 at scale
- Execute on product roadmap

---

_Document Version: 1.0_  
_Last Updated: February 2026_  
_Model available in spreadsheet format upon request_
