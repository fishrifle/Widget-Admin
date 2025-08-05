import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Palette, Heart, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-6xl font-black text-gray-900 tracking-tight">PassItOn</h1>
            <p className="text-lg text-gray-600 mt-2 font-medium">Widget Admin Dashboard</p>
          </div>
          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="outline" className="bg-white border-gray-300 hover:bg-gray-50">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Create Beautiful Donation Widgets
          </h2>
          <p className="text-xl text-gray-700 mb-8 leading-relaxed">
            Design, customize, and deploy donation widgets that seamlessly integrate with any website. 
            Track donations, manage causes, and grow your impact.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700">
              Create Your Widget
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Palette className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Easy Customization</h3>
            <p className="text-gray-600 leading-relaxed">
              Design widgets that match your brand with colors, fonts, and layouts
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Multiple Causes</h3>
            <p className="text-gray-600 leading-relaxed">
              Create and manage multiple causes with individual tracking and goals
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Payment Options</h3>
            <p className="text-gray-600 leading-relaxed">
              Accept donations via credit cards and bank transfers (ACH)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
