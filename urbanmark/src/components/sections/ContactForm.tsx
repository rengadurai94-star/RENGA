"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitted">("idle");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitted");
  };

  if (status === "submitted") {
    return (
      <div className="flex flex-col gap-3 rounded-sm bg-stone-100 p-10">
        <h3 className="font-display text-2xl font-medium text-ink">Thank you.</h3>
        <p className="text-ink/60">
          We&apos;ve received your project details and will be in touch within two working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" type="text" required placeholder="Jane Appleseed" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="jane@email.com" />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="projectType">Project type</Label>
          <Select id="projectType" name="projectType" defaultValue="residential">
            <option value="residential">Residential</option>
            <option value="hospitality">Hospitality</option>
            <option value="retail">Retail</option>
            <option value="consultation">Single consultation</option>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget">Approximate budget</Label>
          <Select id="budget" name="budget" defaultValue="50-100k">
            <option value="under-50k">Under £50k</option>
            <option value="50-100k">£50k – £100k</option>
            <option value="100-250k">£100k – £250k</option>
            <option value="250k-plus">£250k+</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">Tell us about the space</Label>
        <Textarea id="message" name="message" required rows={5} placeholder="Location, size, timeline, and what's not working today." />
      </div>

      <Button type="submit" className="w-fit">
        Send project details
      </Button>
    </form>
  );
}
