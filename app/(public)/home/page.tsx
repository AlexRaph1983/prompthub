import { redirect } from 'next/navigation'

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to PromptHub</h1>
      <p className="text-gray-600">This is the public home page.</p>
    </div>
  )
} 