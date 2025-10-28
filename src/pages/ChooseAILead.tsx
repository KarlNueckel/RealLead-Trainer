import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ProgressStepper } from "../components/ProgressStepper";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { motion } from "framer-motion";
import { personas as PersonaConfig } from "../config/personas";
import { getAssistantOverrideFromSearch, ASSISTANT_OVERRIDES } from "../config/assistantOverrides";

type Difficulty = "Easy" | "Medium" | "Hard";

type UIPersona = {
  id: string;
  displayName: string;
  difficulty: Difficulty;
  difficultyStars: number; // scaled for 5-star UI
  description: string;
  image: string; // url or import
  bestScore?: number;
  referralInfo?: string;
  traits?: string[];
};

export default function ChooseAILead() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scenario = (location.state?.scenario as string) || params.get("path") || "Seller Lead - Referral";
  const pathname = location.pathname || '';
  const isReferral2 = params.get("seller_referral2") === "true" || pathname.includes('/seller-lead-referral-listing-consultation');
  const isReferralContract = params.get("seller_referral_contract") === "true" || pathname.includes('/seller-lead-referral-contract-negotiation');
  // Treat any of the seller-lead-referral routes as referral flow
  const isReferralFromPath = pathname.includes('/seller-lead-referral');
  const isReferral = isReferralFromPath || String(scenario).toLowerCase().includes("seller lead - referral");

  // For Referral 2 (Listing Consultation), include Morgan, Avery, and Quinn.
  // For Contract Negotiations, include Avery, Morgan, and Quinn.
  // For base Referral, include Avery, Morgan, and Quinn.
  const allowedIds = isReferral
    ? (isReferralContract
        ? ["avery", "morgan", "quinn"]
        : (isReferral2 ? ["morgan", "avery", "quinn"] : ["avery", "morgan", "quinn"]))
    : [];

  const [currentPage, setCurrentPage] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const cardsPerPage = 2;

  const allUIPersonas: UIPersona[] = useMemo(() => {
    // Map 3-tier difficulty to a 5-star scale
    const mapStars5 = (d: Difficulty) => (d === "Easy" ? 2 : d === "Medium" ? 3 : 5);
    return PersonaConfig
      .filter((p) => allowedIds.includes(p.id))
      .map((p) => {
        let description = p.description as string;
        let referralInfo: string | undefined;
        let traits: string[] | undefined;

        // Page-specific overrides for Initial Call (Referral)
        if (p.id === "avery") {
          referralInfo = "Referred to you by her previous Agent Ryan";
          description =
            "Warm, approachable young woman looking to sell her great‑grandparents' home and move to Europe. She wants to move quickly and is very trusting given the referral from her previous agent and friend Ryan.";
          traits = ["Friendly", "Conversational", "Realistic", "Naive"];
        } else if (p.id === "morgan") {
          referralInfo = "Referred to you by his previous Agent Jacob";
          description =
            "Professional Executive and Buisness Owner. Respects Agents that can show their prowess through Quantitative Metrics, Statistics and Detailed Plans. He will only work with a Professional. He has realistic goals as he understands the markets and the challenges that come with selling a property.";
          traits = ["Professional", "Detail-Oriented", "Composed", "Realistic", "To-The-Point"];
        } else if (p.id === "quinn") {
          referralInfo = "Referred to you by her colleague Heather";
          description =
            "Composed, measured communicator with a neutral American cadence. Direct and pragmatic; expects clarity and professionalism.";
          traits = ["Calm", "Direct", "Composed", "Pragmatic"];
        }

        return {
          id: p.id,
          // Stage-specific display names per route
          displayName: (
            isReferralContract
              ? (p.id === 'morgan' ? 'Morgan – Contract Negotiation' : p.id === 'quinn' ? 'Quinn – Contract Negotiation' : p.displayName)
              : (isReferral2
                  ? (p.id === 'morgan' ? 'Morgan – Listing Consultation' : p.id === 'quinn' ? 'Quinn – Listing Consultation' : p.displayName)
                  : p.displayName)
          ),
          difficulty: p.difficulty as Difficulty,
          difficultyStars: p.id === "avery" ? 1 : p.id === "quinn" ? 4 : mapStars5(p.difficulty as Difficulty),
          description,
          image: p.image as unknown as string,
          referralInfo,
          traits,
        } as UIPersona;
      });
  }, [allowedIds, isReferral2]);

  const filtered = useMemo(() => {
    if (difficultyFilter === "all") return allUIPersonas;
    return allUIPersonas.filter((p) => p.difficulty === difficultyFilter);
  }, [allUIPersonas, difficultyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / cardsPerPage));

  const handleNext = () => {
    if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
  };
  const handlePrev = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  const handleSelect = (p: UIPersona) => {
    const persona = PersonaConfig.find((x) => x.id === p.id)!;
    let vapiAssistantId: string | undefined = (
      isReferral2 ? (ASSISTANT_OVERRIDES as any)?.seller_referral2?.[persona.id] :
      isReferralContract ? (ASSISTANT_OVERRIDES as any)?.seller_referral_contract?.[persona.id] :
      getAssistantOverrideFromSearch(location.search, persona.id)
    );
    if (isReferral && !isReferral2 && !isReferralContract) {
      if (persona.id === "morgan") {
        vapiAssistantId = "7a84ad61-a24c-4f05-a4f7-eefca3630201";
      } else if (persona.id === "quinn") {
        // Quinn - Seller Lead Referral (Initial Call)
        vapiAssistantId = "4781f1aa-dc0c-4162-8f63-3711feaee753";
      }
    }
    const state = {
      scenario,
      // Ensure display name reflects current stage
      persona: (
        isReferralContract
          ? (persona.id === 'morgan'
              ? { ...persona, displayName: 'Morgan – Contract Negotiation' }
              : persona.id === 'quinn'
                ? { ...persona, displayName: 'Quinn – Contract Negotiation' }
                : persona)
          : (isReferral2
              ? (persona.id === 'morgan'
                  ? { ...persona, displayName: 'Morgan – Listing Consultation' }
                  : persona.id === 'quinn'
                    ? { ...persona, displayName: 'Quinn – Listing Consultation' }
                    : persona)
              : persona)
      ),
      seller_referral2: isReferral2,
      seller_referral_contract: isReferralContract,
      vapiAssistantId,
    } as any;
    navigate("/pick-script", { state });
  };

  const handleFilterChange = (value: string) => {
    setDifficultyFilter(value);
    setCurrentPage(0);
  };

  if (allowedIds.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center py-10 bg-gray-50">
        <div className="w-full max-w-5xl px-6 mb-6">
          <button
            onClick={() => navigate("/scenarios")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scenarios
          </button>
        </div>
        <ProgressStepper
          steps={[
            { label: "Scenarios", completed: true, active: false },
            { label: "AI Lead", completed: false, active: true },
            { label: "Script", completed: false, active: false },
            { label: "Conversation", completed: false, active: false },
          ]}
        />
        <div className="w-full max-w-3xl mt-10 text-center bg-white rounded-2xl border border-gray-200 p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">AI personas not available</h2>
          <p className="text-gray-600">This scenario does not have AI personas yet. Please choose the Seller Lead - Referral scenario to practice with Avery or Morgan.</p>
          <button
            onClick={() => navigate("/scenarios")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Top Navigation */}
      <div className="px-8 py-6">
        <button
          onClick={() => navigate("/scenarios")}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#1E293B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scenarios</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="px-8 pb-8">
        <ProgressStepper
          steps={[
            { label: "Scenarios", completed: true, active: false },
            { label: "AI Lead", completed: false, active: true },
            { label: "Script", completed: false, active: false },
            { label: "Conversation", completed: false, active: false },
          ]}
        />
      </div>

      {/* Title Section with Filter */}
      <div className="text-center mb-8">
        <h1 className="text-[#1E293B] mb-3">Choose Your AI Lead</h1>
        <p className="text-[#64748B] mb-6">Select a persona to determine the AI's tone, difficulty, and personality style.</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-[#64748B]">Filter by difficulty:</span>
          <Select value={difficultyFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[180px] bg-white border-[#CBD5E1]">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="Easy">⭐ Easy</SelectItem>
              <SelectItem value="Medium">⭐⭐ Medium</SelectItem>
              <SelectItem value="Hard">⭐⭐⭐ Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative px-8">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0A3E91]/90 hover:bg-[#0A3E91] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center"
          aria-label="Previous personas"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="overflow-hidden max-w-[1400px] mx-auto">
          <motion.div
            className="flex gap-8"
            animate={{ x: `calc(-${currentPage * 100}% - ${currentPage * 32}px)` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {filtered.map((persona) => (
              <div key={persona.id} className="w-[calc(50%-16px)] flex-shrink-0">
                <PersonaCard persona={persona} onSelect={handleSelect} isReferral2={isReferral2} isReferralContract={isReferralContract} />
              </div>
            ))}
          </motion.div>
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#0A3E91]/90 hover:bg-[#0A3E91] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center"
          aria-label="Next personas"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-12">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`transition-all ${index === currentPage ? "w-8 h-2.5 bg-[#0A3E91]" : "w-2.5 h-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]"} rounded-full`}
            aria-label={`Go to page ${index + 1}`}
          />)
        )}
      </div>
    </div>
  );
}

type PersonaCardProps = {
  persona: UIPersona;
  onSelect: (persona: UIPersona) => void;
  isReferral2?: boolean;
  isReferralContract?: boolean;
};

function PersonaCard({ persona, onSelect, isReferral2, isReferralContract }: PersonaCardProps) {
  const getGradeInfo = (score: number): { grade: string; color: string } => {
    if (score >= 90) return { grade: "A", color: "#22C55E" };
    if (score >= 80) return { grade: "B", color: "#3B82F6" };
    if (score >= 70) return { grade: "C", color: "#EAB308" };
    if (score >= 60) return { grade: "D", color: "#F97316" };
    return { grade: "F", color: "#EF4444" };
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden h-[600px] border-2 border-black/20">
      <div className="flex h-full">
        <div className="w-1/2 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-[#1E293B] mb-2">{persona.displayName}</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < persona.difficultyStars ? "fill-[#FCD34D] text-[#FCD34D]" : "fill-[#E5E7EB] text-[#E5E7EB]"}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-[#64748B]">{persona.difficulty}</span>
              </div>
              {(isReferral2 || isReferralContract) && persona.id === "avery" ? (
                <div className="text-sm text-[#64748B] italic">
                  {isReferralContract ? (
                    <>
                      <p>Contract Negotiation following Listing Consultation</p>
                      <p>Referred to you by her previous Agent Ryan</p>
                    </>
                  ) : (
                    <>
                      <p>Listing Consultation after a Successful Introductory Call</p>
                      <p>Referred to you by her previous Agent Ryan</p>
                    </>
                  )}
                </div>
              ) : persona.referralInfo ? (
                <p className="text-sm text-[#64748B] italic">{persona.referralInfo}</p>
              ) : (
                <p className="text-sm text-[#64748B] italic">Seller Lead - Referral</p>
              )}
            </div>

            <p className="text-sm text-[#64748B] leading-relaxed">{persona.description}</p>

            {/* Traits placeholder could be added later */}
            <div>
              <h4 className="text-sm text-[#1E293B] mb-2">Personality Traits</h4>
              <div className="flex flex-wrap gap-1.5">
                {(persona.traits && persona.traits.length > 0
                  ? persona.traits
                  : ["Conversational", "Natural", "Realistic"]
                ).map((trait) => (
                  <Badge
                    key={trait}
                    variant="secondary"
                    className="bg-[#EFF4FF] text-[#0A3E91] border-0 px-2.5 py-1 text-xs hover:bg-[#DBEAFE]"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {typeof persona.bestScore === "number" && (
            <div className="flex items-center justify-center mb-4">
              <ScoreBadge score={persona.bestScore} getGradeInfo={getGradeInfo} />
            </div>
          )}

          <Button onClick={() => onSelect(persona)} className="w-full bg-[#163E7A] hover:bg-[#0A3E91] text-white rounded-lg shadow-md hover:shadow-lg transition-all">
            {(() => {
              // Base name should be the clean persona name without stage suffixes
              const original = PersonaConfig.find((x) => x.id === persona.id)?.displayName || persona.displayName;
              const clean = String(original).split('–')[0].split('-')[0].trim();
              if (isReferralContract) return `Select ${clean} - Contract Negotiation`;
              return `Select ${persona.displayName}`;
            })()}
          </Button>
        </div>

        <div className="w-1/2 relative bg-gradient-to-br from-[#EAF0FF] to-[#F9FAFB]">
          <img src={persona.image} alt={persona.displayName} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-4 right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < persona.difficultyStars ? "fill-[#FCD34D] text-[#FCD34D]" : "fill-[#E5E7EB] text-[#E5E7EB]"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#1E293B]">{persona.difficulty}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ScoreBadgeProps = {
  score: number;
  getGradeInfo: (score: number) => { grade: string; color: string };
};

function ScoreBadge({ score, getGradeInfo }: ScoreBadgeProps) {
  const { grade, color } = getGradeInfo(score);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl" style={{ color }}>
            {grade}
          </span>
          <span className="text-xs text-[#64748B]">{score}/100</span>
        </div>
      </div>
      <span className="text-xs text-[#64748B]">Best Score</span>
    </div>
  );
}
