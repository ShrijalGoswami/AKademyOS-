import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Props {
  name: string | null;
  email: string | null;
  image: string | null;
}

export function StudentHeader({ name, email, image }: Props) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <div className="flex items-center gap-4 mb-8">
      <Avatar className="h-14 w-14 ring-2 ring-primary/30">
        <AvatarImage src={image ?? undefined} alt={name ?? "Student"} />
        <AvatarFallback className="text-base">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          {name ?? "Student"}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-text-secondary">{email}</p>
          <Badge variant="default" className="text-[10px]">Student</Badge>
        </div>
      </div>
    </div>
  );
}
