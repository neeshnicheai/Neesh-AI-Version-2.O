type PersonaType = "developer" | "marketer" | "investor" | "designer" | "entrepreneur" | "researcher" | "other";

interface PersonaEngagement {
  persona: PersonaType;
  visited: number;
  asked: number;
  feedback: number;
  returned: number;
}

interface PersonaEngagementMatrixProps {
  engagementData: PersonaEngagement[];
  onPersonaClick?: (persona: PersonaType) => void;
}

const personaLabels: Record<PersonaType, string> = {
  developer: "Developers",
  marketer: "Marketers",
  investor: "Investors",
  designer: "Designers",
  entrepreneur: "Entrepreneurs",
  researcher: "Researchers",
  other: "Others",
};

const getPersonaLabel = (persona: string) => {
  return personaLabels[persona as PersonaType] || "Others";
};

const engagementColumns = [
  { key: "visited", label: "Visited" },
  { key: "asked", label: "Asked" },
  { key: "feedback", label: "Feedback" },
  { key: "returned", label: "Returned" },
] as const;

// Color scheme for intensity levels - Teal/Cyan based
const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return { bg: "transparent", text: "inherit", border: "hsl(var(--border))" };
  if (intensity < 0.33) return { bg: "hsla(190, 85%, 38%, 0.1)", text: "hsl(190, 85%, 38%)", border: "hsla(190, 85%, 38%, 0.2)" };
  if (intensity < 0.66) return { bg: "hsla(190, 85%, 38%, 0.25)", text: "hsl(190, 85%, 38%)", border: "hsla(190, 85%, 38%, 0.4)" };
  return { bg: "hsla(190, 85%, 38%, 0.4)", text: "hsl(190, 70%, 30%)", border: "hsla(190, 85%, 38%, 0.6)" };
};

const PersonaEngagementMatrix = ({ engagementData, onPersonaClick }: PersonaEngagementMatrixProps) => {
  const getIntensity = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(value / max, 1);
  };

  // Always use real data — no fake fallback
  const dataToUse = engagementData;

  const maxValues = {
    visited: Math.max(...dataToUse.map((d) => d.visited), 1),
    asked: Math.max(...dataToUse.map((d) => d.asked), 1),
    feedback: Math.max(...dataToUse.map((d) => d.feedback), 1),
    returned: Math.max(...dataToUse.map((d) => d.returned), 1),
  };

  const activePersonas = dataToUse.filter(
    (d) => d.visited > 0 || d.asked > 0 || d.feedback > 0 || d.returned > 0
  );

  if (activePersonas.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <div className="text-center py-8">
          <p className="text-sm font-medium text-foreground">No engagement data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Share your idea to start collecting persona insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Persona Engagement Matrix</h2>
        <p className="text-sm text-muted-foreground">Who's engaging and how deeply</p>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-4 text-left font-medium text-muted-foreground">Persona</th>
              {engagementColumns.map((col) => (
                <th key={col.key} className="p-4 text-center font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activePersonas.map((engagement) => (
              <tr
                key={engagement.persona}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onPersonaClick?.(engagement.persona)}
              >
                <td className="p-4 font-medium text-foreground">
                  {getPersonaLabel(engagement.persona)}
                </td>
                {engagementColumns.map((col) => {
                  const value = engagement[col.key];
                  const intensity = getIntensity(value, maxValues[col.key]);
                  const colors = getIntensityColor(intensity);
                  
                  return (
                    <td key={col.key} className="p-4 text-center">
                      <div
                        className="inline-flex items-center justify-center w-12 h-8 text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: colors.bg,
                          color: intensity > 0 ? colors.text : 'inherit',
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        {value}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend - Updated colors */}
      <div className="p-4 bg-muted/30 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border border-border"></span>
            Low
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5" style={{ backgroundColor: 'hsla(190, 85%, 38%, 0.25)', border: '1px solid hsla(190, 85%, 38%, 0.4)' }}></span>
            Medium
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 h-5" style={{ backgroundColor: 'hsla(190, 85%, 38%, 0.4)', border: '1px solid hsla(190, 85%, 38%, 0.6)' }}></span>
            High
          </span>
        </div>
      </div>
    </div>
  );
};

export default PersonaEngagementMatrix;
