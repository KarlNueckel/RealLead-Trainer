import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PhoneCall, Sparkles, Target, TrendingUp } from "lucide-react";

import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();
  const onStart = () => navigate("/scenarios");
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F6FF] to-[#EFF6FF]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-blue-200/50 shadow-sm">
            <Sparkles className="size-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">AI-Powered Sales Training</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Master Your Sales Calls with{" "}
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
                RealLead Trainer
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Practice realistic sales conversations with AI. Build confidence, refine your pitch, 
              and close more deals with live voice training.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button size="lg" onClick={onStart} className="text-base px-10 h-14 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
              <PhoneCall className="mr-2 size-5" />
              Start Training Now
            </Button>
            <Button size="lg" variant="outline" className="text-base px-10 h-14 bg-white/50 backdrop-blur-sm hover:bg-white/80">
              Learn More
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24">
          <Card className="border-blue-200/50 hover:border-blue-400/60 transition-all hover:shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="px-8 py-6">
              <div className="size-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                <PhoneCall className="size-7 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Real-Time Voice AI</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed mt-2">
                Practice with OpenAI's advanced voice technology. Get natural, 
                conversational responses just like a real prospect.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200/50 hover:border-blue-400/60 transition-all hover:shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="px-8 py-6">
              <div className="size-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                <Target className="size-7 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Scenario-Based Training</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed mt-2">
                Choose from cold calls, follow-ups, or product demos. 
                Customize difficulty to match your skill level.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-200/50 hover:border-blue-400/60 transition-all hover:shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="px-8 py-6">
              <div className="size-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                <TrendingUp className="size-7 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900">Instant Feedback</CardTitle>
              <CardDescription className="text-sm text-gray-600 leading-relaxed mt-2">
                Review full transcripts and analyze your performance. 
                Track progress and improve with every session.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-24 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 shadow-xl">
            <CardContent className="px-8 py-8">
              <div className="grid grid-cols-3 gap-12 text-center">
                <div>
                  <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">100%</div>
                  <div className="text-sm font-medium text-gray-700 mt-2">AI-Powered</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-indigo-600 to-indigo-700 bg-clip-text text-transparent">24/7</div>
                  <div className="text-sm font-medium text-gray-700 mt-2">Available</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-br from-violet-600 to-violet-700 bg-clip-text text-transparent">∞</div>
                  <div className="text-sm font-medium text-gray-700 mt-2">Practice Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-20 space-y-6">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900">Ready to level up your sales game?</h3>
          <Button size="lg" onClick={onStart} className="text-base px-10 h-14 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}
