import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { FilterChips } from './FilterChips';
import { Button } from './ui/button';

interface FiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: string[];
  onFilterToggle: (filter: string) => void;
  onClearAll: () => void;
}

export function FiltersSheet({ isOpen, onClose, activeFilters, onFilterToggle, onClearAll }: FiltersSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[540px] bg-gradient-to-br from-white to-gray-50/50">
        <div className="pl-8">
          <SheetHeader>
            <SheetTitle className="text-xl">Filters</SheetTitle>
            <SheetDescription>
              Filter scenarios by audience, stage, and location
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-8">
            <FilterChips activeFilters={activeFilters} onFilterToggle={onFilterToggle} />

            {activeFilters.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <Button onClick={onClearAll} variant="outline" className="w-full border-gray-200 hover:bg-gray-50">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

