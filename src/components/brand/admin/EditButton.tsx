import { Pencil } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Button } from "@/components/ui/button";

interface Props {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Inline Edit pill — only visible when user is signed in.
 * Place INSIDE a `relative` container in each brand section.
 */
export default function EditButton({ onClick, label = "Edit", className = "" }: Props) {
  const { isAuthed } = useAuthSession();
  if (!isAuthed) return null;

  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      variant="outline"
      className={`gap-1.5 rounded-full border-accent/40 bg-card/90 backdrop-blur shadow-md text-xs font-alt uppercase tracking-widest hover:bg-accent hover:text-accent-foreground hover:border-accent transition-smooth ${className}`}
    >
      <Pencil className="h-3 w-3" />
      {label}
    </Button>
  );
}
