import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Cause } from "@/types/widget.types";

interface CauseManagerProps {
  causes: Cause[];
  onChange: (causes: Cause[]) => void;
}

const SUGGESTED_CAUSES = [
  "General Persevere Support",
  "Sponsor a Dev", 
  "Tech Alliance",
  "The Greatest Need",
  "Unlock Potential",
  "Epic Youth",
  "Tennessee Community Programs",
  "Canvas Training Hub",
  "Skills Development",
  "Digital Literacy",
  "Mentorship Programs",
  "Scholarship Fund",
  "Equipment & Resources",
  "Community Outreach",
  "Innovation Lab",
];

export function CauseManager({ causes, onChange }: CauseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newCause, setNewCause] = useState({
    name: "",
    description: "",
    goalAmount: "",
  });

  const MAX_CAUSES = 5;

  const handleAdd = () => {
    if (newCause.name) {
      const cause: Cause = {
        id: Date.now().toString(),
        name: newCause.name,
        description: newCause.description || undefined,
        goalAmount: newCause.goalAmount
          ? Number(newCause.goalAmount)
          : undefined,
        raisedAmount: 0,
        isActive: true,
      };
      onChange([...causes, cause]);
      setNewCause({ name: "", description: "", goalAmount: "" });
      setIsAdding(false);
    }
  };

  const handleUpdate = (id: string, updates: Partial<Cause>) => {
    onChange(causes.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDelete = (id: string) => {
    onChange(causes.filter((c) => c.id !== id));
  };

  const handleUseSuggestion = (suggestion: string) => {
    setNewCause({ ...newCause, name: suggestion });
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      {causes.map((cause) => (
        <Card key={cause.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingId === cause.id ? (
                <div className="space-y-3">
                  <Input
                    value={cause.name}
                    onChange={(e) =>
                      handleUpdate(cause.id, { name: e.target.value })
                    }
                    placeholder="Cause name"
                  />
                  <Textarea
                    value={cause.description || ""}
                    onChange={(e) =>
                      handleUpdate(cause.id, { description: e.target.value })
                    }
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <Input
                    type="number"
                    value={cause.goalAmount || ""}
                    onChange={(e) =>
                      handleUpdate(cause.id, {
                        goalAmount: Number(e.target.value) || undefined,
                      })
                    }
                    placeholder="Goal amount (optional)"
                  />
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold">{cause.name}</h4>
                  {cause.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {cause.description}
                    </p>
                  )}
                  {cause.goalAmount && (
                    <p className="text-sm text-gray-500 mt-1">
                      Goal: ${cause.goalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Switch
                checked={cause.isActive}
                onCheckedChange={(checked) =>
                  handleUpdate(cause.id, { isActive: checked })
                }
              />
              {editingId === cause.id ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(cause.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(cause.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}

      {isAdding ? (
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cause Name</Label>
              <Button
                onClick={() => setShowSuggestions(!showSuggestions)}
                size="sm"
                variant="ghost"
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showSuggestions ? "Hide" : "Show"} Suggestions
              </Button>
            </div>
            <Input
              value={newCause.name}
              onChange={(e) => setNewCause({ ...newCause, name: e.target.value })}
              placeholder="Type your custom cause name"
              autoFocus
            />
            
            {showSuggestions && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                {SUGGESTED_CAUSES.filter(suggestion => 
                  !causes.some(cause => cause.name === suggestion)
                ).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="text-left text-xs p-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Textarea
            value={newCause.description}
            onChange={(e) =>
              setNewCause({ ...newCause, description: e.target.value })
            }
            placeholder="Description (optional)"
            rows={2}
          />
          <Input
            type="number"
            value={newCause.goalAmount}
            onChange={(e) =>
              setNewCause({ ...newCause, goalAmount: e.target.value })
            }
            placeholder="Goal amount (optional)"
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} size="sm" disabled={!newCause.name.trim()}>
              Add Cause ({causes.length + 1}/{MAX_CAUSES})
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setShowSuggestions(false);
                setNewCause({ name: "", description: "", goalAmount: "" });
              }}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {causes.length < MAX_CAUSES ? (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Cause ({causes.length}/{MAX_CAUSES})
            </Button>
          ) : (
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                Maximum {MAX_CAUSES} causes added ✓
              </p>
              <p className="text-xs text-blue-600 mt-1">
                You can edit or remove existing causes to add new ones
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
