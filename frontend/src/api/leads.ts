import {
  AttachPictureParams,
  CreateLeadParams,
  CreateLeadResponse,
  PresignPictureParams,
  PresignPictureResponse,
  UploadImageParams,
} from "@/types/leads";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function createLead(
  params: CreateLeadParams
): Promise<CreateLeadResponse> {
  const { payload } = params;
  console.log("VITE_API_BASE_URL =", import.meta.env.VITE_API_BASE_URL);

  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // throw new Error("Lead submission failed");
    const text = await response.text().catch(() => "");
    throw new Error(text || "Lead submission failed");
  }

  const data = await response.json();
  return { leadId: data.leadId, pictureToken: data.pictureToken };
}

export async function presignPicture(
  params: PresignPictureParams
): Promise<PresignPictureResponse> {
  const { leadId, payload, pictureToken } = params;

  const response = await fetch(
    `${API_BASE_URL}/leads/${leadId}/pictures/presign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pictureToken}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get presigned POST");
  }

  return response.json();
}

export async function uploadImageToS3(
  params: UploadImageParams
): Promise<void> {
  const { url, fields, file } = params;

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
  params: AttachPictureParams
): Promise<void> {
  const { leadId, payload, pictureToken } = params;

  const response = await fetch(`${API_BASE_URL}/leads/${leadId}/pictures`, {
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
