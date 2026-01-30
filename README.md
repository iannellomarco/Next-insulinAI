# InsulinAI 💉🤖

An AI-powered insulin dosage calculator that helps people with diabetes make informed insulin dosing decisions based on food image analysis and nutritional data.

## ✨ Features

- **📸 Food Image Analysis** - Scan photos of your meals and get instant carb counts
- **✍️ Manual Entry** - Type in food items for quick calculations
- **🧮 Smart Insulin Dosing** - Calculates suggested insulin doses based on your personal carb ratio and correction factor
- **🍕 Split Bolus Detection** - Automatically detects high-fat meals and recommends split dosing strategies
- **📊 History Tracking** - Keep a log of all your meals and insulin doses with cloud sync
- **📈 Advanced Reporting** - View charts and statistics of your glucose trends, insulin usage, and carb intake over 7, 30, and 90 days
- **⏱️ 2-Hour Post-Meal Checks** - Track glucose levels after meals to validate dosing accuracy
- **🔄 Multi-Device Sync** - Access your data from any device with cloud synchronization
- **🔐 Secure Authentication** - Powered by Clerk for safe, encrypted user data
- **🎨 Beautiful UI** - Modern, responsive design with dark mode support

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with TypeScript
- **Authentication**: [Clerk](https://clerk.com/)
- **Database**: PostgreSQL (Prisma Postgres)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **AI**: [Perplexity AI](https://www.perplexity.ai/) for food analysis
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Perplexity API key ([get one here](https://docs.perplexity.ai/))
- A Clerk account for authentication ([sign up](https://clerk.com/))
- A Postgres database (recommended: [Prisma Postgres](https://www.prisma.io/postgres))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iannellomarco/Next-insulinAI.git
   cd Next-insulinAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Perplexity AI
   PERPLEXITY_API_KEY=your_perplexity_api_key

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Database (Prisma Postgres)
   POSTGRES_URL=your_postgres_connection_string
   PRISMA_DATABASE_URL=your_prisma_accelerate_url
   DATABASE_URL=your_postgres_connection_string
   ```

4. **Push the database schema**
   ```bash
   npx drizzle-kit push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com/new)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## 🎯 How It Works

1. **Capture or Enter Food**: Take a photo of your meal or manually type what you're eating
2. **AI Analysis**: Perplexity AI analyzes the food and estimates carbohydrates, fats, and proteins
3. **Insulin Calculation**: The app calculates recommended insulin doses based on your personal settings
4. **Split Bolus Detection**: For high-fat meals, the app suggests splitting your dose over time
5. **Track & Sync**: All your data is saved to the cloud and synced across devices
6. **Detailed Reports**: Visualize your health data with interactive charts and summaries
7. **Post-Meal Tracking**: Add 2-hour glucose checks to validate your dosing accuracy

## ⚙️ Configuration

Access the settings menu to configure:
- **Carb Ratio**: Your insulin-to-carb ratio (e.g., 1 unit per 10g carbs)
- **Correction Factor**: How much 1 unit of insulin lowers your blood glucose
- **Target Glucose**: Your target blood glucose level
- **High/Low Thresholds**: Glucose alert thresholds
- **Smart History**: Enable AI context from previous meals

## ⚠️ Important Disclaimer

**This app is a tool to assist with diabetes management, not a replacement for medical advice.** 

- Always consult with your healthcare provider before making changes to your insulin regimen
- Verify all calculations and use your clinical judgment
- The AI analysis is an estimate and may not be 100% accurate
- Individual responses to insulin vary based on many factors

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Perplexity AI](https://www.perplexity.ai/) for food analysis
- Authentication by [Clerk](https://clerk.com/)
- Database by [Prisma Postgres](https://www.prisma.io/postgres)
- Icons from [Lucide](https://lucide.dev/)

---

**Made with ❤️ for the diabetes community**
