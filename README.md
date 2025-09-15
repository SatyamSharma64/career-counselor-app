# Career Counselor AI

An **AI-powered career–counseling web app** that lets users chat with a virtual advisor, explore quick-start topics, and keep an organized history of sessions.

---

## Table of Contents
- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)
- [Author](#author)

---

## Live Demo
- **[Visit the Live Application](https://career-counselor-alpha.vercel.app/)**

---

## 📸 Screenshots

### 1. Landing Page

![Landing Page](./screenshots/landing-page.png)
_Welcome page with feature overview and getting started tips_

### 2. Chat Interface

![Chat Interface](./screenshots/chat-interface-light.png)
_Real-time chat with the AI career counselor_

### 4. Authentication

![Authentication](./screenshots/auth-page.png)
_Secure Google OAuth authentication_

---

## Features
- Create, rename, and delete **chat sessions**  
- **Quick Start** modal with curated conversation starters  
- Infinite scroll sidebar with lazy loading of past sessions  
- Real-time **OpenAI** responses with robust error handling and context trimming  
- **Persisted history** in a relational database  
- Responsive design with light/dark themes  
- Keyboard shortcuts (e.g., `Esc` to close modals)

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | **Next.js 15** (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui |
| State / Data | **tRPC** · tanstack Query |
| Backend | Next.js API routes · **Prisma** ORM · PostgreSQL (default, swappable) |
| AI | **OpenAI Responses API** |
| Tooling | ESLint · Prettier · Husky · Commitlint |

---

## Installation

### 1. Clone
   ```bash
   git clone https://github.com/SatyamSharma64/career-counselor-app.git
   cd career-counselor-ai
   ```

### 2. Install dependencies
   ```bash
   pnpm install        # or npm / yarn
   ```

### 3. Environment variables

   Create `.env` from the example and fill in your secrets:

   ```env
   # Database
    DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

    # NextAuth
    NEXTAUTH_SECRET="your-nextauth-secret"
    NEXTAUTH_URL="http://localhost:3000"

    # OpenAI
    OPENAI_API_KEY="your-openai-api-key"
    OpenAI_MODEL="gpt-5-nano"
    # OAuth Providers 
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"
    GITHUB_CLIENT_ID="your-github-client-id"
    GITHUB_CLIENT_SECRET="your-github-client-secret"
   ```

### 4. Database setup
   ```bash
   npx prisma migrate dev --name init
   ```

### 5. OAuth Setup

#### 1. Google
1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Set up Google OAuth**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)

#### 2. Github
1. **Create a Github OAuth Project**:

   - Log in to GitHub account, go to Settings. In the left-hand navigation, scroll down and click on Developer settings.
   - Click on OAuth Apps and then select New OAuth App.
   - Fill in the Application Details:
        - Application name: The name of the app.
        - Add home page URIs:.
            - `http://localhost:3000` (development)
            - `https://your-domain.com` (production)
        - Add authorized redirect URIs:
            - `http://localhost:3000/api/auth/callback/github` (development)
            - `https://your-domain.com/api/auth/callback/github` (production)

2. **Get Github OAuth details**:
   - Copy the OAuth Client ID from the redirected new applicatons page, can also be visible under the OAuth Apps.
    - Copy the visible Client ID. 
    - Click the Generate a new client secret button to get the Client Secret.

### 6. Run dev server
   ```bash
   pnpm dev            # http://localhost:3000
   ```

---

## Usage

1. Click **“New Chat”** to start a fresh session.  
2. Type your career question and press **Enter**.  
3. Use the **Quick Start** button for pre-defined prompts (e.g., *Salary Negotiation Advice*).  
4. Delete a session with the trash icon; the app automatically redirects if you’re inside that chat.  

> Tip: press **Esc** to close modals or stop generating a response.

---

## Project Status
Actively developed – roadmap includes:
- OAuth login
- PDF export of chat transcripts
- Vector search for document-grounded answers

---

## Contributing

1. Fork the repo and create your branch:
   ```bash
   git checkout -b feature/amazing-idea
   ```
2. Follow existing ESLint/Prettier rules (`pnpm lint`).
3. Commit using Conventional Commits.
4. Open a pull request describing your change.

Bug reports and feature requests are welcome via GitHub Issues.

---

## License
Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

## Credits
- **OpenAI** for the Responses API  
- **shadcn/ui** for elegant React components  
- **t3 stack** community for type-safe full-stack patterns  

---

## Author
[Satyam Sharma](https://satyam-sharma.vercel.app/) – feel free to reach out for questions or collaboration opportunities.