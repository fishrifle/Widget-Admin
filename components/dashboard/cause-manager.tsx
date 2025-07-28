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

export function CauseManager({ causes, onChange }: CauseManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCause, setNewCause] = useState({
    name: "",
    description: "",
    goalAmount: "",
  });

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
          <Input
            value={newCause.name}
            onChange={(e) => setNewCause({ ...newCause, name: e.target.value })}
            placeholder="Cause name"
            autoFocus
          />
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
            <Button onClick={handleAdd} size="sm">
              Add Cause
            </Button>
            <Button
              onClick={() => {
                setIsAdding(false);
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
        <Button
          onClick={() => setIsAdding(true)}
          variant="outline"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Cause
        </Button>
      )}
    </div>
  );
}
