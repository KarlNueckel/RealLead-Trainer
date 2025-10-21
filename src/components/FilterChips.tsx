import { X } from 'lucide-react';

interface FilterChipsProps {
  activeFilters: string[];
  onFilterToggle: (filter: string) => void;
}

const filterGroups = {
  audience: ['Buyers', 'Sellers', 'Referrals', 'SOI', 'Expired/FSBO'],
  stage: ['New Lead', 'Follow-Up', 'Prequalification', 'Appointment', 'Closing'],
  location: ['Phone Call', 'In Person'],
};

export function FilterChips({ activeFilters, onFilterToggle }: FilterChipsProps) {
  return (
    <div className="space-y-8">
      {/* Audience Filters */}
      <div className="space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Audience</p>
        <div className="flex flex-wrap gap-2">
          {filterGroups.audience.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterToggle(filter)}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                activeFilters.includes(filter)
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
              }`}
            >
              {filter}
              {activeFilters.includes(filter) && (
                <X className="inline-block w-3 h-3 ml-1.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Filters */}
      <div className="space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Stage</p>
        <div className="flex flex-wrap gap-2">
          {filterGroups.stage.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterToggle(filter)}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                activeFilters.includes(filter)
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
              }`}
            >
              {filter}
              {activeFilters.includes(filter) && (
                <X className="inline-block w-3 h-3 ml-1.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Location Filters */}
      <div className="space-y-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
        <div className="flex flex-wrap gap-2">
          {filterGroups.location.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterToggle(filter)}
              className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                activeFilters.includes(filter)
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 scale-105'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
              }`}
            >
              {filter}
              {activeFilters.includes(filter) && (
                <X className="inline-block w-3 h-3 ml-1.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

