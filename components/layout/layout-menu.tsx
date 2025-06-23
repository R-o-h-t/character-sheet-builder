'use client'

import { MessageCircle } from "lucide-react";
import { ModeToggle } from "../theme/theme-toggle";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LayoutMenu({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn(
      "absolute flex items-center justify-center top-0 right-0 bg-card/50 backdrop-blur-md border-b border-border py-2 pr-4 rounded-bl-lg z-10",
      className
    )}
      {...props}>
      <ModeToggle />
      <Button
        variant="outline"
        size="icon"
        className="ml-2"
        onClick={() => toast("This is a toast message!")}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div >
  )
}
