# BMS Frontend

A modern, comprehensive Business Management System (BMS) dashboard built with the latest web technologies. This application streamlines organizational processes including user management, task tracking, attendance monitoring, and leave management.

## 🚀 Features

- **📊 Dashboard Overview**: Centralized hub for key metrics and system activities.
- **busts Users Management**: Comprehensive administrative tools for managing user profiles and roles.
- **✅ Task Tracking**: Efficient task assignment, progress tracking, and management.
- **📅 Attendance System**: Digital attendance marking and monitoring.
- **🏖️ Leave Management**: Streamlined leave application and approval workflows.
- **🔒 Secure Authentication**: Robust login and authentication system.

## 🛠️ Technology Stack

This project is built using a modern frontend stack focused on performance, scalability, and developer experience:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

## 📂 Project Structure

```bash
frontend/
├── app/                  # Next.js App Router directory
│   ├── (auth)/          # Authentication routes (login, etc.)
│   └── (dashboard)/     # Protected dashboard routes
│       ├── attendance/   # Attendance feature
│       ├── dashboard/    # Main dashboard view
│       ├── leaves/       # Leave management feature
│       ├── tasks/        # Task management feature
│       └── users/        # User management feature
├── components/           # Reusable UI components
│   └── ui/              # Base UI primitives
├── lib/                  # Utility functions and configurations
└── public/               # Static assets
```

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (Latest LTS recommended)
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository** (if applicable)

2. **Navigate to the frontend directory**

   ```bash
   cd frontend
   ```

3. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

4. **Set up environment variables**
   Create a `.env.local` file in the root directory and configure the necessary environment variables (e.g., API endpoints).

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
