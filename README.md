# 🤖 BotByte CLI

An AI-powered command-line interface that performs tasks for you with minimal effort. Let AI handle the heavy lifting while you focus on what matters.

## ✨ Features

- **AI-Powered Tasks** - Execute complex operations with simple natural language commands
- **Minimal Effort** - Describe what you want, and BotByte handles the rest
- **Smart Automation** - Automate repetitive tasks intelligently
- **Cross-Platform** - Works on Windows, macOS, and Linux

## 📦 Project Structure

```
botbyte-cli/
├── client/          # Next.js frontend with shadcn/ui
│   ├── app/         # App router pages
│   ├── components/  # UI components
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utility functions
│   └── tests/       # Frontend tests
├── server/          # Express.js backend
│   ├── src/         # Source code
│   └── tests/       # API tests
└── .github/         # GitHub Actions workflows
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/sanketbagad/bobyte-cli.git
cd bobyte-cli

# Install dependencies (installs both client and server)
npm install
```

### Development

```bash
# Run client (Next.js)
npm run dev:client

# Run server (Express)
npm run dev:server

# Run both in separate terminals
```

### Testing

```bash
# Run all tests
npm test

# Run client tests only
npm run test:client

# Run server tests only
npm run test:server

# Run tests with coverage
npm run test:coverage --workspace=client
npm run test:coverage --workspace=server
```

### Building

```bash
# Build client
npm run build:client

# Build server
npm run build:server
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Jest** - Testing
- **React Testing Library** - Component testing

### Backend
- **Express.js 5** - Web framework
- **TypeScript** - Type safety
- **Jest** - Testing
- **Supertest** - API testing

### DevOps
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **Commitlint** - Commit message validation
- **ESLint** - Code linting
- **GitHub Actions** - CI/CD

## 📝 Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

# Examples
feat: add new AI command parser
fix: resolve memory leak in CLI
docs: update installation guide
chore: update dependencies
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:client` | Start client dev server |
| `npm run dev:server` | Start server dev server |
| `npm run build:client` | Build client for production |
| `npm run build:server` | Build server for production |
| `npm test` | Run all tests |
| `npm run test:client` | Run client tests |
| `npm run test:server` | Run server tests |
| `npm run lint` | Lint all code |
| `npm run lint:client` | Lint client code |
| `npm run lint:server` | Lint server code |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Sanket Bagad**

- GitHub: [@sanketbagad](https://github.com/sanketbagad)

---

<p align="center">Made with ❤️ by BotByte</p>
