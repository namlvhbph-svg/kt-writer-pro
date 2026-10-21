import { useMemo, useState } from "react";
import { Check, Plus, Search, Tag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type KeywordOption = { id: string; term: string };

type Props = {
  options: KeywordOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function KeywordPicker({
  options,
  selected,
  onChange,
  placeholder = "Gắn từ khóa…",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.term.toLowerCase().includes(term));
  }, [options, search]);

  const selectedOptions = options.filter((option) => selectedSet.has(option.id));

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedOptions.length === 0 ? (
          <span className="text-xs text-muted-foreground">Chưa gắn từ khóa nào.</span>
        ) : (
          selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="secondary"
              className="gap-1 border-primary/20 bg-primary/10 pl-2 pr-1 py-0.5 font-normal text-primary"
            >
              <Tag className="h-3 w-3" />
              {option.term}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(option.id)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                  aria-label={`Bỏ từ khóa ${option.term}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            className="h-8 border-dashed text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm từ khóa…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy từ khóa phù hợp.
                </p>
              ) : (
                filtered.map((option) => {
                  const isSelected = selectedSet.has(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggle(option.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      <span className="pr-2">{option.term}</span>
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
