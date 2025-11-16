# Siloq - Business Management & Invoicing App

> A comprehensive mobile-first business management solution for freelancers and small businesses. Track invoices, estimates, expenses, and mileage all in one beautiful app.

[![React Native](https://img.shields.io/badge/React_Native-0.76.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo SDK](https://img.shields.io/badge/Expo-54.0.0-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📱 About Siloq

Siloq is a modern, mobile-first business management application that combines the best features of invoice management tools with comprehensive expense tracking and analytics. Built with React Native and Expo, it provides a seamless experience across iOS, Android, and web platforms.

### Vision

To provide freelancers and small businesses with a professional, easy-to-use tool for managing their entire business operations from their mobile device.

### Design Philosophy

- **Mobile-First**: Optimized for on-the-go business management
- **Professional**: Clean, modern UI inspired by Invoice Simple
- **Complete**: All business operations in one place
- **Offline-Ready**: Work anywhere, sync when connected
- **Privacy-Focused**: Your data is yours, secured with RLS

---

## ✨ Features

### 💼 Invoice Management
- **Create & Edit Invoices** with professional templates
- **Client Management** with full contact details
- **Line Items** with automatic calculations (subtotal, tax, discount, total)
- **Multiple Payment Terms** (Due on Receipt, Net 15/30/60/90)
- **Status Tracking** (Draft, Sent, Paid, Overdue)
- **Search & Filter** by client, invoice number, amount
- **Year Grouping** with annual totals
- **Native Date Pickers** for invoice and due dates

### 📊 Estimates & Quotes
- **Estimate Creation** similar to invoices
- **Status Tracking** (Pending, Accepted, Declined)
- **Conversion Tracking** for accepted estimates
- **Expiry Date Management** with auto-calculation
- **Search Functionality** across all estimates

### 💰 Expense Tracking
- **Quick Expense Entry** with category selection
- **Tax Deductibility** tracking for business expenses
- **Monthly Grouping** with category totals
- **Category Management** (Meals, Travel, Office, etc.)
- **Receipt Attachment** support (future: OCR)
- **Search by Merchant** or category

### 🚗 Mileage Tracking
- **Trip Logging** with start/end locations
- **Automatic IRS Rate Calculation** ($0.67/mile for 2024)
- **Business/Personal** trip classification
- **Monthly Totals** with deduction calculations
- **Tax Deduction Reports** for business miles
- **Search by Location** or purpose

### 📈 Dashboard & Analytics
- **Real-Time Metrics**: This Month income, expenses, net profit
- **Quick Actions**: Create invoice, estimate, expense, or log mileage
- **Outstanding Invoices** tracking
- **Recent Activity** feed
- **Pull-to-Refresh** with haptic feedback
- **Profile Quick Access**

### 📊 Reports & Analytics
- **Comprehensive Reports Dashboard**:
  - Time period selector (This Month, Last Month, This Year, All Time)
  - Income vs Expenses metrics
  - Top 5 Clients by revenue
  - Expenses breakdown by category

- **Tax Reporting**:
  - Tax year selector
  - Business income/expenses summary
  - Mileage deduction calculator
  - Monthly income breakdown
  - Deductible expenses by category
  - Tax preparation insights

### ⚙️ Settings & Customization
- **Account Settings**: Profile management, contact info
- **Business Settings**: Business details, invoice defaults, tax ID
- **App Settings**: Theme preferences, currency, notifications

### 🎨 User Experience
- **Form Validation**: Inline errors with helpful messages
- **Error Boundaries**: Graceful error handling
- **Search Functionality**: Fast search across all screens
- **Loading States**: Smooth loading indicators
- **Empty States**: Helpful guidance when no data exists
- **Haptic Feedback**: Tactile confirmation on actions
- **Native Interactions**: Platform-specific behaviors

---

## 🛠 Tech Stack

### Frontend
- **React Native** (0.76.5) - Cross-platform mobile framework
- **Expo** (SDK 54) - Development platform and tooling
- **TypeScript** (5.3) - Type-safe development
- **Expo Router** - File-based routing
- **React Native Reanimated** - Smooth animations
- **React Native Gesture Handler** - Touch interactions
- **Expo Haptics** - Tactile feedback
- **@react-native-community/datetimepicker** - Native date pickers

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication
  - Storage

### State Management
- **Zustand** - Lightweight state management
- **React Hooks** - Local component state

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **Custom Design System** - Siloq brand colors
  - Primary: Siloq Blue (#2F6D92)
  - Accent: Siloq Mint (#63D1C5)
  - Professional color palette

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking
- **Git** - Version control

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS only, via Xcode)
- **Android Studio** (for Android Emulator)
- **Supabase Account** (for backend services)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/siloq-app.git
cd siloq-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under **API**.

### 4. Database Setup

Run the migrations to set up your database schema:

```bash
# Navigate to your Supabase project dashboard
# Go to SQL Editor and run all migration files in order from:
# supabase/migrations/
```

Or use the Supabase CLI:

```bash
supabase db push
```

**Migration Files:**
1. `20250115000001_add_phone_to_profiles.sql` - Add phone to profiles
2. `20250115000002_add_invoice_defaults_to_business_settings.sql` - Business settings
3. `20250115000002_create_app_settings.sql` - App preferences
4. `20250115000003_create_mileage_table.sql` - Mileage tracking
5. `20250115000004_fix_mileage_table.sql` - Mileage table fix

### 5. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Press `w` for Web Browser
- Scan QR code with Expo Go app on your phone

---

## 📁 Project Structure

```
siloq-app/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Dashboard
│   │   ├── invoices.tsx          # Invoices list
│   │   ├── expenses.tsx          # Expenses list
│   │   ├── estimates.tsx         # Estimates list (hidden from tabs)
│   │   ├── more.tsx              # More menu
│   │   └── _layout.tsx           # Tab navigator config
│   ├── invoices/                 # Invoice screens
│   │   ├── new.tsx               # Create invoice
│   │   └── [id].tsx              # Invoice detail
│   ├── estimates/                # Estimate screens
│   │   ├── new.tsx               # Create estimate
│   │   └── [id].tsx              # Estimate detail
│   ├── expenses/                 # Expense screens
│   │   ├── new.tsx               # Create expense
│   │   └── [id].tsx              # Expense detail
│   ├── mileage/                  # Mileage screens
│   │   ├── index.tsx             # Mileage list
│   │   ├── new.tsx               # Log mileage
│   │   └── [id].tsx              # Mileage detail
│   ├── settings/                 # Settings screens
│   │   ├── account.tsx           # Account settings
│   │   ├── business.tsx          # Business settings
│   │   └── app.tsx               # App preferences
│   ├── reports/                  # Reports & Analytics
│   │   └── index.tsx             # Reports dashboard
│   ├── tax-report/               # Tax reporting
│   │   └── index.tsx             # Tax report screen
│   ├── _layout.tsx               # Root layout with auth
│   └── +not-found.tsx            # 404 page
│
├── components/                   # Reusable components
│   ├── ClientSelector.tsx        # Client picker modal
│   ├── DatePicker.tsx            # Native date picker wrapper
│   └── ErrorBoundary.tsx         # Error handling component
│
├── lib/                          # Utilities and configuration
│   ├── stores/                   # Zustand stores
│   │   └── auth.ts               # Authentication store
│   ├── types/                    # TypeScript types
│   │   ├── index.ts              # Main types
│   │   └── database.ts           # Supabase types
│   ├── constants.ts              # App constants
│   ├── supabase.ts               # Supabase client
│   ├── theme.ts                  # Design system
│   ├── utils.ts                  # Utility functions
│   └── validation.ts             # Form validation utilities
│
├── supabase/                     # Supabase configuration
│   └── migrations/               # Database migrations
│
├── assets/                       # Static assets
│   ├── icon.png                  # App icon (1024x1024)
│   ├── adaptive-icon.png         # Android adaptive icon
│   ├── splash-icon.png           # Splash screen icon
│   └── favicon.png               # Web favicon
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind/NativeWind config
├── ROADMAP.md                    # Development roadmap
└── README.md                     # This file
```

---

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Start with cache clear
npm start -- --clear

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Style

- **TypeScript** for type safety
- **Functional components** with hooks
- **Named exports** for components
- **Consistent naming**: PascalCase for components, camelCase for functions
- **Comments** for complex logic
- **Error handling** with try-catch and proper error messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## 🗄 Database Schema

### Core Tables

**`profiles`** - User profiles
- id, user_id, full_name, phone, email, created_at, updated_at

**`clients`** - Client management
- id, user_id, name, email, phone, address, notes, created_at, updated_at

**`invoices`** - Invoice tracking
- id, user_id, client_id, invoice_number, date, due_date, status, line_items, subtotal, tax, discount, total, balance_due, notes, share_token

**`estimates`** - Estimate/quote tracking
- id, user_id, client_id, estimate_number, date, expiry_date, status, line_items, subtotal, tax, discount, total, notes

**`expenses`** - Expense tracking
- id, user_id, merchant, category, total, date, is_tax_deductible, notes, receipt_url

**`mileage`** - Mileage tracking
- id, user_id, date, start_location, end_location, miles, purpose, notes, is_business, rate_per_mile, total_amount

**`business_settings`** - Business configuration
- id, user_id, business_name, address, city, state, zip, phone, email, tax_id, default_payment_terms, default_tax_rate, default_notes

**`app_settings`** - User preferences
- id, user_id, theme, currency, push_notifications, email_notifications

### Security

All tables use **Row Level Security (RLS)** policies to ensure users can only access their own data.

---

## 🚀 Deployment

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### Environment Variables for Production

Set these in your EAS Build configuration:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 🔮 Future Roadmap

See [ROADMAP.md](./ROADMAP.md) for the complete development roadmap.

### Next Up (Phase 1: High Priority)
- 📄 **Invoice PDF Generation** - Professional PDF export
- 📧 **Email Invoice Functionality** - Send invoices to clients
- 💳 **Payment Recording** - Track payments received
- 👥 **Client Management** - Full CRUD for clients
- 📸 **Receipt Camera** - Photo capture for expenses

### Coming Soon (Phase 2: Core Features)
- 🔄 **Recurring Invoices** - Automated invoice generation
- 🎨 **Invoice Templates** - Customizable branding
- 🌐 **Client Portal** - Public invoice viewing
- ⏰ **Payment Reminders** - Automated follow-ups
- 💰 **Payment Gateway** - Stripe/PayPal integration

### Future Enhancements (Phases 3-6)
- 🌙 **Dark Mode** - Theme customization
- ⏱️ **Time Tracking** - Billable hours tracking
- 💱 **Multi-Currency** - International support
- 📊 **Advanced Analytics** - Business intelligence
- 🔐 **Team Collaboration** - Multi-user support
- 🤖 **AI Insights** - Smart business suggestions
- 🔗 **Accounting Integration** - QuickBooks, Xero
- 📱 **GPS Mileage** - Auto-tracking with GPS
- 🔔 **Push Notifications** - Real-time alerts
- 🎯 **Budget Tracking** - Expense budgets

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Review Process

- All code must pass TypeScript type checking
- Follow existing code style and conventions
- Add comments for complex logic
- Update documentation as needed
- Test on both iOS and Android before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Landon Spell**

---

## 🙏 Acknowledgments

- **Invoice Simple** - UX inspiration
- **Ledgerly** - Design system inspiration
- **Expo Team** - Amazing development platform
- **Supabase Team** - Powerful backend platform
- **React Native Community** - Excellent ecosystem

---

## 📧 Support

For support, email support@siloq.app or open an issue on GitHub.

---

## 🎯 Project Status

**Current Version**: 1.0.0
**Status**: Active Development
**Last Updated**: November 16, 2024

### Completed Features: ✅
- Core invoice, estimate, expense management
- Mileage tracking with tax calculations
- Dashboard and analytics
- Reports and tax reporting
- Settings and preferences
- Search and filtering
- Form validation
- Error handling
- Mobile optimizations

### In Progress: 🚧
- PDF generation
- Email functionality
- Payment recording

### Planned: 📋
- See [ROADMAP.md](./ROADMAP.md) for full roadmap

---

**Built with ❤️ using React Native and Expo**
