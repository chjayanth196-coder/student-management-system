"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  onAdd?: {
    label: string;
    onClick: () => void;
  };
}

export function PageHeader({ title, description, onAdd }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {onAdd && (
        <Button onClick={onAdd.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {onAdd.label}
        </Button>
      )}
    </div>
  );
}
