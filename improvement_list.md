# Alexandria - TOP 3 High-Leverage Feature Opportunities

---

## 1. Variable/Template System with Quick-Fill

**What's Missing:** The markdown parser already highlights `{placeholder}` text with a CSS class, but this is purely visual. There's no actual variable substitution system. Users storing prompts like *"Write a {tone} email about {topic} for {audience}"* must manually find and replace values every single time they use it.

**Why It Matters:** This is the difference between a **reference library** and an **active tool**. Most users don't store static prompts—they store reusable templates they want to customize quickly. Without variable substitution, every prompt use requires: copy → paste → read through → find placeholders → manually replace. This friction compounds with every use.

**What to Implement:**
- Detect `{variableName}` patterns when a prompt is clicked for copy
- Show a quick-fill modal: prefilled input fields for each variable detected
- One button: "Fill & Copy" → substitutes all values → copies to clipboard → closes
- Store variable definitions on prompts (optional: default values, descriptions)
- Support required vs optional variables (`{topic}` vs `{tone?}`)

**Impact:** Transforms every stored prompt into an immediately-usable template. Reduces prompt usage from 5+ steps to 2 steps (click → fill → done).

---

## 2. Recent Prompts & Usage Tracking

**What's Missing:** Every session starts from zero. No "Recently Used" section, no usage count, no memory of what prompts you actually use. Users must search/browse their entire library every time, even for prompts they use daily.

**Why It Matters:** The 80/20 rule applies heavily here—users likely have 5-10 prompts they use frequently and 50+ they rarely touch. Without usage memory, the most valuable prompts are buried among the rest. This forces users to search every time, adding friction to the most common workflow.

**What to Implement:**
- Add `lastUsedAt` and `useCount` fields to prompt schema
- Increment on every copy action
- Add "Recent" section at top of prompt list (last 5 used)
- Sort by `useCount` for "Most Used" filter option
- Persist in Chrome Storage alongside prompts

**Impact:** Frequent prompts become zero-search. Users open extension → their top 5 are right there → one click to copy. Removes search friction for 80% of use cases.

---

## 3. Contextual Metadata: Target Model & Effectiveness Notes

**What's Missing:** Prompts are stored as pure text with no context. The playground saves metadata (`optimizedFor`, `useCase`, `source`) when saving optimized prompts, but regular prompts get none of this. Users can't track which prompts work best with which AI models, or add personal notes about effectiveness.

**Why It Matters:** Users accumulate prompts from different sources for different purposes. A prompt optimized for Claude might perform poorly with GPT-4. Without metadata, users must remember or relearn which prompts work where. This becomes exponentially worse as the library grows.

**What to Implement:**
- Add metadata fields to prompt schema:
  - `targetModel`: string or array (e.g., `"claude"`, `["gpt-4", "claude"]`)
  - `useCase`: string (e.g., `"code-review"`, `"email-writing"`)
  - `personalNotes`: string (free-form effectiveness notes)
  - `source`: string (where prompt came from)
- Add these fields to the "Add/Edit Prompt" modal
- Add filter dropdown for target model
- Display metadata badges on prompt cards in list view
- Show notes in the panel view

**Impact:** Users can filter prompts by context ("show me prompts for Claude coding tasks"). Notes create a feedback loop for prompt effectiveness. The library becomes searchable by *intent*, not just keywords.
