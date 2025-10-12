import { useState } from "react";
import { personas, type Persona } from "../config/personas";

interface PersonaSelectionProps {
  onSelect: (persona: Persona | null) => void;
}

export function PersonaSelection({ onSelect }: PersonaSelectionProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  const handlePersonaSelect = (p: Persona) => {
    setSelectedPersona(p);
    onSelect(p);
  };

  return (
    <div className="w-full max-w-5xl px-6">
      <h2 className="text-3xl font-semibold mb-8 text-center text-gray-900">Choose Your AI Lead</h2>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {personas.map((persona) => {
          const difficultyStars = {
            Easy: "⭐",
            Medium: "⭐⭐⭐",
            Hard: "⭐⭐⭐⭐⭐"
          }[persona.difficulty] || "⭐";

          return (
            <div
              key={persona.id}
              onClick={() => handlePersonaSelect(persona)}
              className={`flex flex-col items-center bg-white rounded-2xl shadow-md transition-all cursor-pointer p-6 border-2
                ${selectedPersona?.id === persona.id 
                  ? "border-blue-500 shadow-blue-200 scale-105" 
                  : "border-transparent hover:shadow-lg hover:scale-102"
                }`}
            >
              <div className="flex items-center w-full mb-4">
                <img
                  src={persona.image}
                  alt={persona.displayName}
                  className="w-20 h-20 rounded-full object-cover mr-4 border-2 border-gray-200"
                />
                <div className="flex flex-col items-start flex-1">
                  <h4 className="text-xl font-semibold text-gray-800">{persona.displayName}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {difficultyStars} <span className="ml-1">({persona.difficulty})</span>
                  </p>
                </div>
              </div>
              <p className="text-gray-600 text-sm text-center leading-relaxed">
                {persona.description}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 mt-6 text-center">
        Select a persona to determine the AI's personality and difficulty level
      </p>
    </div>
  );
}

