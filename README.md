# DiaryWhisper

A personal expenses and day log tracking API that works with Siri Shortcuts. Using Siri as a CLI.

## 🎯 Features

- Expenses and diary tracking through Siri
- Secure API key authentication
- PostgreSQL database for data storage
- Soft delete support for data integrity
- Flexible reporting options

## 🗣️ Supported Commands

### Expense Management

#### Add an Expense

```
add -desc "description" -cost amount -cat category -date "date"
```

Example: `add -desc "Weekly groceries" -cost 87.50 -cat groceries -date "2025-01-15"`

#### Update an Expense

```
update expenseId -desc "new description" -cost newAmount -cat newCategory
```

All flags are optional - only include what you want to change.  
Example: `update abc123 -cost 92.30 -cat groceries`

#### Delete an Expense

```
delete expenseId
```

Example: `delete abc123`

#### Generate Report

```
report -from dateFrom -to dateTo -export boolean
```

Example: `report -from "2025-01-01" -to "2025-01-31" -export true`

Generates and emails an expense report for the specified period. The report includes:

- Total expenses for the period
- Breakdown by category showing total amount, number of transactions and average per transaction
- Detailed list of all expenses with dates, descriptions and amounts

The `export` flag is optional - when set to true, a JSON file with the raw data will be attached to the email.

### Day Log

```
daylog -stars number -text "text" -date "date"
```

Example: `daylog -stars 3 -text "Meeting notes or daily summary" -date "2024-01-18"`

Adds a log entry for a specific day. The date parameter is optional and defaults to the current date.

Logs are stored with UTC midnight timestamps for consistent date handling
Multiple entries can be added to the same day
Each entry includes the original timestamp

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
- PostgreSQL

### 💻 Installation

1. Clone the repository:

```bash
git clone https://github.com/RiccardoSenica/diarywhisper
cd diarywhisper
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
yarn vercel:link

# Pull environment variables
yarn vercel:env
```

4. Set up the database:

```bash
# Push Prisma schema to database
yarn prisma:push

# Generate Prisma client
yarn prisma:generate
```

### 🔐 Environment Variables

Create a `.env` file with:

```
API_KEY=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
PGDATABASE=
PGHOST=
PGHOST_UNPOOLED=
PGPASSWORD=
PGUSER=
POSTGRES_DATABASE=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_PRISMA_URL=
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_URL_NO_SSL=
POSTGRES_USER=
RECIPIENT_EMAIL=
RESEND_API_KEY=
SENDER_EMAIL=
```

### 🗄️ Database Management

Reset database (⚠️ Warning: this will delete all data):

```bash
yarn prisma:reset
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
    "instruction": "add -desc \"Coffee\" -cost 3.50 -cat food"
  },
  "apiKey": "your_api_key_here"
}
```
