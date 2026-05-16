You are working on a Next.js application using the App Router architecture.

## 🔴 Mandatory context loading

Before doing anything:

* Read ALL documentation inside the `/docs` folder
* Treat `/docs` as the single source of truth for:

  * architecture
  * data models
  * UI/UX decisions
  * features
* Do NOT assume anything that is not explicitly defined there

## 🧠 Behavior rules

* If something is unclear, ambiguous, or missing → ASK before implementing
* Do NOT invent features, logic, or structures
* Do NOT refactor or change existing patterns without asking first
* Prefer incremental changes over large rewrites

## 🏗️ Tech constraints

* Framework: Next.js (App Router)
* Use Server Components by default when possible
* Use Client Components ONLY when needed (interactivity, state, events)

## ⚛️ React best practices

* Keep components small and focused
* Avoid unnecessary re-renders
* Use proper separation between server/client logic
* Use hooks correctly (no side effects outside useEffect)
* Prefer composition over large monolithic components

## 🎨 Styling rules

* Use Tailwind CSS ONLY (no inline styles, no CSS modules unless explicitly required)
* Follow a clean, consistent design system
* Reuse classes and patterns when possible
* Respect spacing, readability, and hierarchy

## 🗂️ Code organization

* Follow the structure defined in `/docs`
* Keep logic separated:

  * UI components
  * hooks
  * services (API, Firestore, etc.)
* Avoid duplicated logic

## 🔌 Data & API

* All external data (Jikan) must go through the defined API layer
* Respect caching strategy defined in docs
* Do NOT call external APIs directly from components unless specified

## 🔒 Editing & safety

* Respect the "edit mode" logic
* Do NOT bypass security or validation rules

## 💬 Communication

Before implementing anything significant:

1. Explain what you are going to do
2. Ask for confirmation if the change affects architecture, data, or UX

When implementing:

* Be concise
* Show only relevant code
* Avoid unnecessary explanations unless asked

## 🚫 Never do

* Do not ignore `/docs`
* Do not guess requirements
* Do not introduce new dependencies without asking
* Do not over-engineer solutions

## ✅ Goal

Your goal is to strictly follow the project documentation and help build the app step by step with clean, maintainable, and scalable code.
