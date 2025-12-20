import {
  CreateLeadPayload,
  CreateLeadResponse,
  ImageUploadResponse,
} from "@/types/leads";

export async function createLead(
  payload: CreateLeadPayload
): Promise<CreateLeadResponse> {
  const response = await fetch("http://localhost:3000/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Lead submission failed");
  }

  const data = await response.json();
  return {
    leadId: data.leadId,
    uploadUrl: data.uploadUrl,
    publicUrl: data.publicUrl,
  };
}

// Optional: Keep this for regenerating URLs with actual filename
export async function getImageUploadUrl(
  leadId: string,
  fileName: string,
  contentType: string
): Promise<ImageUploadResponse> {
  const response = await fetch(
    `http://localhost:3000/leads/${leadId}/image-upload-url?fileName=${encodeURIComponent(
      fileName
    )}&contentType=${encodeURIComponent(contentType)}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get upload URL");
  }

  return response.json();
}

export async function uploadImageToS3(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Image upload to S3 failed");
  }
}

export async function updateLeadWithImage(
  leadId: string,
  imageUrl: string
): Promise<void> {
  const response = await fetch(`http://localhost:3000/leads/${leadId}/image`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    throw new Error("Failed to update lead with image");
  }
}
