import {
  CreateLeadPayload,
  CreateLeadResponse,
  PresignPictureRequest,
  PresignPictureResponse,
  AttachPictureRequest,
} from "@/types/leads";

const API_BASE = "http://localhost:3000";

export async function createLead(
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> {
  const response = await fetch(`${API_BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }

  const data = await response.json();
  return { leadId: data.leadId, pictureToken: data.pictureToken };
}

export async function presignPicture(
  leadId: string,
  payload: PresignPictureRequest,
  pictureToken: string
): Promise<PresignPictureResponse> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/pictures/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pictureToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned POST");
  }

  return response.json();
}

export async function uploadImageToS3(
  url: string,
  fields: Record<string, string>,
  file: File
): Promise<void> {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload to S3 failed");
  }
}

export async function attachPictureToLead(
  leadId: string,
  payload: AttachPictureRequest,
  pictureToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/leads/${leadId}/pictures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pictureToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to attach picture to lead");
  }
}
