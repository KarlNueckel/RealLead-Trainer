import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Phone, Star, ArrowLeft } from 'lucide-react';
import { ScenarioCard } from '../components/ScenarioCard';
import { ScenarioGroup } from '../components/ScenarioGroup';
import { ColdCallModal } from '../components/ColdCallModal';
import { FiltersSheet } from '../components/FiltersSheet';
import { ProgressStepper } from '../components/ProgressStepper';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

export default function CallScenarios() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [isColdCallModalOpen, setIsColdCallModalOpen] = useState(false);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'favorites'>('content');

  const steps = [
    { label: 'Call Scenario', completed: false, active: true },
    { label: 'AI Lead', completed: false, active: false },
    { label: 'Script', completed: false, active: false },
    { label: 'Conversation', completed: false, active: false },
  ];

  const scenarios = [
    { id: 100, title: 'Seller Lead - Referral', likes: 14, tags: ['Sellers', 'Referrals', 'Phone Call'], location: 'Phone Call' as const },
    { id: 101, title: 'Seller Lead - Referral 2 (Listing Consultation)', likes: 5, tags: ['Sellers', 'Referrals', 'Phone Call'], location: 'Phone Call' as const },
    { id: 1, title: 'Market Positioning', likes: 6, tags: ['Sellers', 'New Lead', 'Phone Call'], location: 'Phone Call' as const },
    { id: 2, title: 'Sphere of Influence', likes: 10, tags: ['SOI', 'Referrals', 'In Person'], location: 'In Person' as const },
    { id: 3, title: 'Seller Prequalification Questionnaire', likes: 6, tags: ['Sellers', 'Prequalification', 'Phone Call'], location: 'Phone Call' as const },
    { id: 4, title: 'Ask for the Referral', likes: 8, tags: ['Referrals', 'Follow-Up', 'In Person'], location: 'In Person' as const },
    { id: 5, title: 'Buyer Consultation Script', likes: 12, tags: ['Buyers', 'New Lead', 'In Person'], location: 'In Person' as const },
    { id: 6, title: 'Handling Price Objections', likes: 15, tags: ['Sellers', 'Appointment', 'Phone Call'], location: 'Phone Call' as const },
    { id: 7, title: 'Expired Listing Outreach', likes: 9, tags: ['Expired/FSBO', 'New Lead', 'Phone Call'], location: 'Phone Call' as const },
    { id: 8, title: 'Closing the Deal', likes: 11, tags: ['Buyers', 'Closing', 'In Person'], location: 'In Person' as const },
  ];

  const handleFilterToggle = (filter: string) => {
    setActiveFilters((prev) => prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]);
  };

  const handleClearFilters = () => setActiveFilters([]);

  const filteredScenarios = scenarios
    .filter((s) => (activeFilters.length === 0 ? true : activeFilters.some((f) => s.tags.includes(f))))
    .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleScenarioClick = (title: string) => {
    if (title === 'Seller Lead - Referral 2 (Listing Consultation)') {
      // Route with explicit query flag for the second-stage scenario
      navigate('/choose-ai-lead?seller_referral2=true', { state: { scenario: title } });
      return;
    }
    navigate('/choose-ai-lead', { state: { scenario: title } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Back to Home Link */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <ProgressStepper steps={steps} />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 py-4">
            <button
              onClick={() => setActiveTab('content')}
              className={`pb-2 border-b-2 text-sm transition-all flex items-center gap-2 ${
                activeTab === 'content'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-2 border-b-2 text-sm transition-all flex items-center gap-2 ${
                activeTab === 'favorites'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4" />
              Favorites
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <Input
              type="text"
              placeholder="Search Scenarios"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 bg-white/90 backdrop-blur-sm border-gray-200 rounded-xl shadow-sm w-full focus:shadow-md focus:border-blue-300 transition-all"
            />
          </div>
        </div>

        {/* Cold Call CTA */}
        <div className="mb-10">
          <button
            onClick={() => setIsColdCallModalOpen(true)}
            className="w-full bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8c] to-[#1e3a5f] hover:from-[#1a3254] hover:via-[#27527d] hover:to-[#1a3254] text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-400/20 rounded-xl p-2.5 group-hover:bg-blue-400/30 transition-colors">
                    <Phone className="w-5 h-5" />
                  </div>
                  <h2 className="text-white">Start a Cold Call</h2>
                </div>
                <p className="text-blue-100/90 text-sm max-w-2xl">
                  Practice your cold calling skills with AI-powered roleplay scenarios
                </p>
              </div>
              <div className="bg-blue-400/20 rounded-2xl p-5 group-hover:bg-blue-400/30 group-hover:scale-110 transition-all">
                <Phone className="w-8 h-8" />
              </div>
            </div>
          </button>
        </div>

        {/* Header and Sort */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {activeTab === 'content' ? (
              <>
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-2">
                  <span className="text-2xl">Scripts</span>
                </div>
                <div>
                  <h1 className="text-[#1a2540]">Script Scenarios</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Browse and practice real estate scenarios</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl p-2">
                  <Star className="w-6 h-6 text-amber-600 fill-amber-600" />
                </div>
                <div>
                  <h1 className="text-[#1a2540]">Favorite Scenarios</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Quick access to bookmarked scenarios</p>
                </div>
              </>
            )}
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 border-blue-200">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-transparent border-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="likes">Likes</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setIsFiltersSheetOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-white/90 bg-white/70 backdrop-blur-sm rounded-xl transition-all shadow-sm border border-gray-100 hover:shadow-md"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>All Filters</span>
              {activeFilters.length > 0 && (
                <Badge variant="default" className="ml-1 bg-blue-600 hover:bg-blue-700">
                  {activeFilters.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Scenario Grid */}
        {activeTab === 'favorites' ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl p-6 w-fit mx-auto mb-4">
              <Star className="w-16 h-16 text-gray-300" />
            </div>
            <h3 className="text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-500 text-sm">
              Bookmark your favorite scenarios to access them quickly
            </p>
          </div>
        ) : filteredScenarios.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {(() => {
              // Coalesce referral scenarios into one expandable group
              const referralTitles = new Set([
                'Seller Lead - Referral',
                'Seller Lead - Referral 2 (Listing Consultation)'
              ]);
              const renderItems: any[] = [];
              let addedGroup = false;
              for (const s of filteredScenarios) {
                if (referralTitles.has(s.title)) {
                  if (!addedGroup) {
                    renderItems.push({ type: 'group' });
                    addedGroup = true;
                  }
                  continue; // skip individual referral cards
                }
                renderItems.push({ type: 'card', item: s });
              }

              return renderItems.map((entry, idx) => {
                if (entry.type === 'group') {
                  const likeSum = (scenarios.find(x => x.id === 100)?.likes || 0) + (scenarios.find(x => x.id === 101)?.likes || 0);
                  return (
                    <ScenarioGroup
                      key={`referral-group-${idx}`}
                      title="Seller Lead - Referral"
                      description="Master every stage of a referral-based listing - from first call to final contract."
                      likes={likeSum}
                      steps={[
                        { title: 'Initial Call', icon: 'phone', description: 'Simulate the first contact call', link: '/choose-ai-lead' },
                        { title: 'Listing Consultation', icon: 'home', description: 'Guide the in-home consultation', link: '/choose-ai-lead?seller_referral2=true' },
                        { title: 'Contract Negotiations', icon: 'home', description: 'Negotiate listing price, commission, and contract terms with motivated or hesitant sellers.', link: '/choose-ai-lead?seller_referral_contract=true' },
                      ]}
                    />
                  );
                }

                const scenario = entry.item;
                return (
                  <ScenarioCard
                    key={scenario.id}
                    title={scenario.title}
                    likes={scenario.likes}
                    location={scenario.location}
                    description={scenario.title === 'Seller Lead - Referral 2 (Listing Consultation)'
                      ? 'Second stage of seller training - Avery is ready to discuss listing details and next steps.'
                      : undefined}
                    onClick={() => handleScenarioClick(scenario.title)}
                  />
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
            <p className="text-gray-500 mb-4">No scenarios match your filters</p>
            <Button onClick={handleClearFilters} variant="outline" className="bg-white hover:bg-gray-50">
              Clear all filters
            </Button>
          </div>
        )}
      </div>

      {/* Cold Call Modal */}
      <ColdCallModal
        isOpen={isColdCallModalOpen}
        onClose={() => setIsColdCallModalOpen(false)}
        onStart={() => navigate('/choose-ai-lead', { state: { scenario: 'Cold Call - Homeowner' } })}
      />

      {/* Filters Sheet */}
      <FiltersSheet
        isOpen={isFiltersSheetOpen}
        onClose={() => setIsFiltersSheetOpen(false)}
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onClearAll={handleClearFilters}
      />
    </div>
  );
}







