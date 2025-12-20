import { CreateLeadPayload } from "@/types/leads";

export async function createLead(payload: CreateLeadPayload): Promise<void> {
  const response = await fetch("http://localhost:3000/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }
}
