import { NextRequest, NextResponse } from "next/server";

const FIELD_LABELS: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  phone: "Phone",
  university: "University",
  university_other: "Institution",
  field_of_study: "Field of study",
  field_of_study_other: "Field",
  academic_level: "Academic level",
  academic_level_other: "Academic level",
  graduation_year: "Graduation year",
  graduation_year_other: "Graduation year",
  current_year: "Current year",
  plans_next_year: "Plans for next year",
  perspective_gala: "Your vision of the Gala",
  benefit_from_event: "How the Gala will help you",
  heard_about: "How you heard about us",
  heard_about_other: "How you heard about us",
};

/** The form shows `email` errors on the field and otherwise reads `error`.
 *  Turn the backend's other field errors into one readable `error` line. */
function withReadableError(data: any) {
  if (!data || typeof data !== "object" || data.email || data.error || data.detail) {
    return data;
  }
  const parts = Object.entries(data)
    .filter(([key]) => key !== "details")
    .map(([key, value]) => {
      const message = Array.isArray(value) ? value.join(" ") : String(value);
      return `${FIELD_LABELS[key] || key}: ${message}`;
    });
  return parts.length ? { ...data, error: parts.join(" · ") } : data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const defaultUrl =
      process.env.NODE_ENV === "production"
        ? "https://gala-dashboard-backend.onrender.com"
        : "http://127.0.0.1:8000";

    const apiBaseUrl = (
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      defaultUrl
    ).replace(/\/$/, "");

    const response = await fetch(`${apiBaseUrl}/api/participants/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        withReadableError(data) || { error: "Failed to register participant" },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Participant registration proxy error:", error);
    return NextResponse.json(
      { error: "Unable to reach the registration server. Please try again." },
      { status: 502 }
    );
  }
}
