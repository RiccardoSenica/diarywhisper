# WalletWhisper

A personal expense tracking API that works with Siri Shortcuts. Track your expenses with voice commands through Siri and manage your budget effectively.

## 🎯 Features

- Voice-controlled expense tracking through Siri
- Secure API key authentication
- PostgreSQL database for reliable data storage
- Soft delete support for data integrity
- Automatic category management
- Flexible reporting options

## 🗣️ Supported Commands

### Expense Management

#### Add an Expense
```
add --desc "description" --cost amount --cat category
```
Example: `add --desc "Weekly groceries" --cost 87.50 --cat groceries`

#### Update an Expense
```
update expenseId --desc "new description" --cost newAmount --cat newCategory
```
All flags are optional - only include what you want to change.  
Example: `update abc123 --cost 92.30 --cat groceries`

#### Delete an Expense
```
delete expenseId
```
Example: `delete abc123`

#### Generate Report
```
report --from "2024-01-01" --to "2024-01-31" --export true
```
The `export` flag is optional.

### System Commands

#### Check System Status
```
ping
```
Returns system operational status and timestamp.

## 🏁 Getting Started

### 📋 Prerequisites

- Node.js 18 or higher
- Docker for local development
- Vercel CLI
- Yarn package manager
- PostgreSQL (provided via Docker)

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
# Install Vercel CLI globally
yarn global add vercel@latest

# Link to your Vercel project
yarn vercel link

# Pull environment variables
yarn vercel env pull
```

4. Set up the database:
```bash
# Push Prisma schema to database
yarn db:push

# Generate Prisma client
yarn prisma generate
```

### 🔐 Environment Variables

Create a `.env` file with:
```
POSTGRES_PRISMA_URL=your_connection_string_here
POSTGRES_URL_NON_POOLING=your_direct_connection_string_here
API_KEY=your_secure_api_key_here
```

### 🗄️ Database Management

Reset database (⚠️ Warning: this will delete all data):
```bash
yarn db:reset
```

## 🔄 API Response Format

All API responses follow this structure:
```typescript
{
  success: boolean;
  message: string;
  data?: unknown;
  action?: {
    type: 'notification' | 'openUrl' | 'runShortcut' | 'wait';
    payload: unknown;
  };
}
```

## 🔒 Security

- All requests must include a valid API key
- Soft delete is implemented to prevent data loss

## 📱 Setting Up Siri Shortcuts

1. Create a new shortcut in the Shortcuts app
2. Add a "Get Contents of URL" action
3. Configure the action:
   - URL: Your deployed API endpoint
   - Method: POST
   - Headers: Add your API key
   - Request Body: JSON with command and parameters

Example shortcut configuration:
```json
{
  "command": "expense",
  "parameters": {
    "instruction": "add --desc \"Coffee\" --cost 3.50 --cat food"
  },
  "apiKey": "your_api_key_here"
}
```
