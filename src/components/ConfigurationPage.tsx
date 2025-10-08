import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { ArrowLeft, Phone, Settings2, Clock, Zap } from "lucide-react";

export interface CallConfig {
  scenario: string;
  difficulty: string;
  duration: number;
}

interface ConfigurationPageProps {
  onBack: () => void;
  onStartCall: (config: CallConfig) => void;
}

export function ConfigurationPage({ onBack, onStartCall }: ConfigurationPageProps) {
  const [scenario, setScenario] = useState("cold-call");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(5);

  const handleStart = () => {
    onStartCall({ scenario, difficulty, duration });
  };

  const scenarioDetails = {
    "cold-call": {
      icon: "📞",
      title: "Cold Call",
      description: "Practice reaching out to prospects who haven't heard from you before. Build rapport and generate interest.",
    },
    "follow-up": {
      icon: "🔄",
      title: "Follow-up Call",
      description: "Continue conversations with warm leads. Address concerns and move prospects through the sales funnel.",
    },
    "demo": {
      icon: "🎯",
      title: "Product Demo",
      description: "Showcase your product's features and benefits. Handle objections and close the deal.",
    },
  };

  const difficultyDetails = {
    "easy": {
      color: "text-green-600",
      description: "Receptive prospect, minimal objections",
    },
    "medium": {
      color: "text-yellow-600",
      description: "Moderately skeptical, requires persuasion",
    },
    "hard": {
      color: "text-red-600",
      description: "Highly challenging, tests your skills",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button variant="ghost" onClick={onBack} className="mb-2">
              <ArrowLeft className="mr-2 size-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
                <Settings2 className="size-8 text-primary" />
                Configure Your Call
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Customize your training session to match your needs
              </p>
            </div>
          </div>

          {/* Configuration Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Training Settings</CardTitle>
              <CardDescription>
                Choose your scenario, difficulty level, and session duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Scenario Selection */}
              <div className="space-y-3">
                <Label htmlFor="scenario" className="flex items-center gap-2">
                  <Phone className="size-4" />
                  Call Scenario
                </Label>
                <Select value={scenario} onValueChange={setScenario}>
                  <SelectTrigger id="scenario">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cold-call">
                      📞 Cold Call
                    </SelectItem>
                    <SelectItem value="follow-up">
                      🔄 Follow-up Call
                    </SelectItem>
                    <SelectItem value="demo">
                      🎯 Product Demo
                    </SelectItem>
                  </SelectContent>
                </Select>
                {/* Scenario Description */}
                <Card className="bg-secondary/50 border-secondary">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{scenarioDetails[scenario as keyof typeof scenarioDetails].icon}</span>
                      <div>
                        <h4 className="font-medium text-sm mb-1">
                          {scenarioDetails[scenario as keyof typeof scenarioDetails].title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {scenarioDetails[scenario as keyof typeof scenarioDetails].description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-3">
                <Label htmlFor="difficulty" className="flex items-center gap-2">
                  <Zap className="size-4" />
                  Difficulty Level
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-green-500"></span>
                        Easy
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-yellow-500"></span>
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="hard">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500"></span>
                        Hard
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Card className="bg-secondary/50 border-secondary">
                  <CardContent className="pt-4 pb-4">
                    <p className={`text-sm font-medium ${difficultyDetails[difficulty as keyof typeof difficultyDetails].color}`}>
                      {difficultyDetails[difficulty as keyof typeof difficultyDetails].description}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Duration Selection */}
              <div className="space-y-3">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <Clock className="size-4" />
                  Session Duration
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="1"
                    max="30"
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 5-10 minutes for focused practice
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Session Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scenario:</span>
                  <span className="font-medium">
                    {scenarioDetails[scenario as keyof typeof scenarioDetails].title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className={`font-medium capitalize ${difficultyDetails[difficulty as keyof typeof difficultyDetails].color}`}>
                    {difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{duration} minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" onClick={onBack} className="sm:flex-1">
              Cancel
            </Button>
            <Button onClick={handleStart} size="lg" className="sm:flex-1">
              <Phone className="mr-2 size-4" />
              Start Call
            </Button>
          </div>

          {/* Info Banner */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Make sure your microphone is enabled and you're in a quiet environment for the best experience.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
