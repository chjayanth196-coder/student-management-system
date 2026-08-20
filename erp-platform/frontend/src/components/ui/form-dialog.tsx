"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Loader2, AlertCircle } from "lucide-react";

export interface FormField {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "date" | "select";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  minLength?: number;
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, any>;
  isLoading?: boolean;
  error?: string;
  submitLabel?: string;
  loadingLabel?: string;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  initialValues,
  isLoading = false,
  error,
  submitLabel = "Save",
  loadingLabel = "Saving...",
}: FormDialogProps) {
  // Build dynamic schema
  const schemaObj: Record<string, any> = {};
  fields.forEach((f) => {
    let s: any = z.string();
    if (f.required) s = s.min(1, `${f.label} is required`);
    if (f.type === "email") s = s.email("Invalid email");
    if (f.minLength) s = s.min(f.minLength, `Min ${f.minLength} characters`);
    if (f.type === "number") {
      s = z.coerce.number();
      if (f.required) s = s.min(1, `${f.label} is required`);
      if (f.min !== undefined) s = s.min(f.min);
      if (f.max !== undefined) s = s.max(f.max);
    }
    schemaObj[f.name] = f.required ? s : s.optional();
  });
  const schema = z.object(schemaObj);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {},
  });

  const handleSubmit = async (values: Record<string, any>) => {
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {field.type === "select" && field.options ? (
                <Select
                  value={form.watch(field.name) || ""}
                  onValueChange={(value) => form.setValue(field.name, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  {...form.register(field.name)}
                  min={field.min}
                  max={field.max}
                  disabled={isLoading}
                />
              )}

              {form.formState.errors[field.name] && (
                <p className="text-xs text-destructive">
                  {form.formState.errors[field.name]?.message as string}
                </p>
              )}
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingLabel}
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

