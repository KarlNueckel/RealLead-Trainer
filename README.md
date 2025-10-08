# RealLead Trainer

A React + TypeScript application for practicing sales calls with AI, built with Vite and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
RealLead-Trainer/
├── src/
│   ├── components/           # React components
│   │   ├── LandingPage.tsx
│   │   ├── ConfigurationPage.tsx
│   │   ├── CallSimulationPage.tsx
│   │   ├── SessionSummaryPage.tsx
│   │   ├── ui/              # UI component library
│   │   └── figma/           # Figma-related components
│   ├── styles/
│   │   └── globals.css      # Global styles and Tailwind configuration
│   ├── App.tsx              # Main application component
│   └── index.tsx            # Application entry point
├── public/                   # Static assets
├── index.html               # HTML entry point
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies

```

## 🛠️ Available Scripts

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Features

- **Landing Page**: Welcome screen with call-to-action
- **Configuration**: Customize your call scenario, difficulty, and duration
- **Call Simulation**: Interactive chat interface with AI
- **Session Summary**: Review your call performance and transcript

## 🧰 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint

## 📝 Development

The app uses a multi-screen flow:
1. **Landing** → Initial welcome screen
2. **Configuration** → Set up call parameters
3. **Simulation** → Live call interaction
4. **Summary** → Session review and statistics

Each screen is a separate component that can be independently developed and tested.

## 🎯 Next Steps

- Add actual AI integration for realistic conversations
- Implement voice recognition and synthesis
- Add performance analytics and feedback
- Create user authentication and session persistence
- Build out the UI component library in `src/components/ui/`
