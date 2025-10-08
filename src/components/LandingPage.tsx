import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PhoneCall, Sparkles, Target, TrendingUp } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Sales Training</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Master Your Sales Calls with{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                RealLead Trainer
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practice realistic sales conversations with AI. Build confidence, refine your pitch, 
              and close more deals with live voice training.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" onClick={onStart} className="text-base px-8 h-12">
              <PhoneCall className="mr-2 size-5" />
              Start Training Now
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              Learn More
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <PhoneCall className="size-6 text-primary" />
              </div>
              <CardTitle>Real-Time Voice AI</CardTitle>
              <CardDescription>
                Practice with OpenAI's advanced voice technology. Get natural, 
                conversational responses just like a real prospect.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Target className="size-6 text-primary" />
              </div>
              <CardTitle>Scenario-Based Training</CardTitle>
              <CardDescription>
                Choose from cold calls, follow-ups, or product demos. 
                Customize difficulty to match your skill level.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="size-6 text-primary" />
              </div>
              <CardTitle>Instant Feedback</CardTitle>
              <CardDescription>
                Review full transcripts and analyze your performance. 
                Track progress and improve with every session.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground mt-1">AI-Powered</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground mt-1">Available</div>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">∞</div>
                  <div className="text-sm text-muted-foreground mt-1">Practice Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16 space-y-4">
          <h3 className="text-2xl font-semibold">Ready to level up your sales game?</h3>
          <Button size="lg" onClick={onStart} className="text-base px-8 h-12">
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}
