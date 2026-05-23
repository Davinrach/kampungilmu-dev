# Kampung Ilmu - Authentication Feature

Book marketplace authentication system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- Customer Login & Registration
- Admin Login
- Mobile-first responsive design
- Form validation
- Password visibility toggle

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Golang (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Davinrach/kampungilmu-dev.git
cd kampungilmu-dev
```

2. Install dependencies
```bash
npm install
```

3. Run development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Available Pages

- `/` - Home page with auth links
- `/login` - Customer login
- `/register` - Customer registration
- `/admin-login` - Admin login

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/           # Customer login
│   │   ├── register/        # Customer registration
│   │   ├── admin-login/     # Admin login
│   │   └── layout.tsx       # Auth layout
│   ├── (public)/            # Public pages
│   │   ├── layout.tsx       # Public layout
│   │   └── page.tsx         # Home page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
└── lib/
    └── api.ts               # API helper for backend integration

```

## Backend Integration

API helper is available at `src/lib/api.ts` for connecting to Golang backend.

Example usage:
```typescript
import api from '@/lib/api';

// Login
const response = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password'
});
```

## Development

This project uses:
- ESLint for code linting
- TypeScript for type safety
- Tailwind CSS for styling

## Branch Structure

- `main` - Production branch (for deployment)
- `fitur` - Development branch (feature development)

## License

Private project - All rights reserved
