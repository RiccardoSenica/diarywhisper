# WalletWhisper

A personal budgeting API that works with Siri Shortcuts. Send voice commands through Siri to track your expenses and manage your budget.

## Commands

Voice commands supported:
- "add [amount] [category]" - Add a new expense
- "spent [amount] [category]" - Same as add
- "balance" - Get your current balance
- "last" - View recent transactions

Example: "add 25 groceries" will record a $25 expense in the groceries category.

## Development Setup

Prerequisites:
- Python 3.8+
- Node.js (for Vercel CLI)
- A Vercel account
- GitHub account

```bash
# Clone the repository
git clone https://github.com/riccardosenica/walletwhisper.git
cd walletwhisper

# Install dependencies
pip install -r requirements.txt

# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link to Vercel project
vercel link

# Pull environment variables
vercel env pull .env
```

## Deployment

The API is automatically deployed when you push to the main branch. To deploy manually:

```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

## Environment Variables

Required environment variables:
- `API_KEY`: Your secret key for API authentication

These can be set in your Vercel project settings and pulled locally using `vercel env pull`.

## Project Structure

```
api/
├── __init__.py      # Python package marker
└── index.py         # Main API endpoint handlers
requirements.txt     # Python dependencies
vercel.json         # Vercel configuration
```

## Local Development

```bash
uvicorn api.index:app --reload
```

API will be available at `http://localhost:8000`

## Testing the API

Health check:
```bash
curl http://localhost:8000/api/health
```

Send a command:
```bash
curl -X POST http://localhost:8000/api/command \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"message": "add 25 groceries"}'
```
