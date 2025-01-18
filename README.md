# WalletWhisper

A personal budgeting API that works with Siri Shortcuts. Send voice commands through Siri to track your expenses and manage your budget.

## Commands

Voice commands supported:

- "add [amount] [category]" - Add a new expense
- "spent [amount] [category]" - Same as add
- "balance" - Get your current balance
- "last" - View recent transactions

Example: "add 25 groceries" will record a $25 expense in the groceries category.

## 🏁 Getting Started

### 📋 Prerequisites

- 📦 Node.js
- 🐳 Docker
- 🔧 Vercel CLI
- 🧶 Yarn package manager

### 💻 Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd walletwhisper
```

2. Install dependencies:

```bash
yarn install
```

3. Set up Vercel:

```bash
# Install Vercel CLI
yarn add -g vercel@latest

# Link to your Vercel project
yarn vercel:link

# Pull environment variables
yarn vercel:env
```

4. Set up the database:

```bash
# Push Prisma schema to database
yarn db:push

# Generate Prisma client
yarn prisma:generate
```

### 🗄️ Database Management

Reset database (⚠️ caution: this will delete all data):

```bash
yarn db:reset
```
