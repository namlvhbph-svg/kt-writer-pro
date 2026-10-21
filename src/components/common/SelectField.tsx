import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Nhãn cho lựa chọn "không lọc" – chỉ dùng ở bộ lọc */
  allLabel?: string;
};

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Chọn…",
  className,
  disabled,
  allLabel,
}: Props) {
  const selectValue = value || (allLabel ? "__all__" : "");

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      ) : null}
      <Select
        value={selectValue}
        onValueChange={(next) => onChange(next === "__all__" ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allLabel ? <SelectItem value="__all__">{allLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
