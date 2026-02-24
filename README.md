# Nazir Bang Stories

A bold blogging platform for unfiltered thoughts, wild ideas, and stories that need to be told.

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: TanStack React Query

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Local Development

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

## Project Structure

```
src/
├── components/      # Reusable UI components
│   └── ui/          # shadcn/ui primitives
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client & types
├── lib/             # Utility functions
└── pages/           # Route pages
supabase/
└── migrations/      # SQL migration files
```

## Build for Production

```sh
npm run build
npm run preview
```

## Deployment

See the deployment guide for detailed instructions on deploying to **Vercel** with a **Supabase** backend.
