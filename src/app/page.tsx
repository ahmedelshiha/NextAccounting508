export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Accounting Firm
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Professional accounting services for your business
        </p>
        <div className="space-x-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            Get Started
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Professional Accounting Services | Accounting Firm',
  description: 'Stress-free accounting for growing businesses.',
}
