declare module "@hookform/resolvers/zod" {
  import { FieldValues, Resolver } from "react-hook-form";
  import { ZodType } from "zod";
  export function zodResolver<T extends ZodType>(
    schema: T
  ): Resolver<z.infer<T>, unknown>;
  export function zodResolver(
    schema: ZodType
  ): Resolver<FieldValues, unknown>;
}

