export interface CalendarConfig {
  provider: "google" | "outlook" | "generic";
  accessToken: string;
  calendarId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  attendees?: string[];
  location?: string;
  status?: "confirmed" | "tentative" | "cancelled";
}

export class CalendarConnector {
  private config: CalendarConfig;

  constructor(config: CalendarConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    switch (this.config.provider) {
      case "google":
        return "https://www.googleapis.com/calendar/v3";
      case "outlook":
        return "https://graph.microsoft.com/v1.0/me/calendars";
      default:
        throw new Error(`Unsupported calendar provider: ${this.config.provider}`);
    }
  }

  private get calendarPath(): string {
    const calId = this.config.calendarId || "primary";
    return this.config.provider === "google"
      ? `/calendars/${encodeURIComponent(calId)}/events`
      : `/${encodeURIComponent(calId)}/events`;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      },
    });
    if (!res.ok) throw new Error(`Calendar API error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  async getEvents(start: string, end: string): Promise<CalendarEvent[]> {
    const params =
      this.config.provider === "google"
        ? `?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&singleEvents=true&orderBy=startTime`
        : `?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`;

    const data = await this.request(`${this.calendarPath}${params}`);

    const items = data.items || data.value || [];
    return items.map((e: any) => ({
      id: e.id,
      title: e.summary || e.subject || "Untitled",
      description: e.description?.body || e.bodyPreview || "",
      start: e.start?.dateTime || e.start?.date || e.start || "",
      end: e.end?.dateTime || e.end?.date || e.end || "",
      attendees: e.attendees?.map((a: any) => a.email) || [],
      location: e.location?.displayName || e.location || "",
      status: e.status || "confirmed",
    }));
  }

  async createEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const body =
      this.config.provider === "google"
        ? {
            summary: event.title,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            attendees: event.attendees?.map((email) => ({ email })),
            location: event.location,
          }
        : {
            subject: event.title,
            body: { contentType: "text", content: event.description },
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            attendees: event.attendees?.map((email) => ({ emailAddress: { address: email } })),
            location: { displayName: event.location },
          };

    const data = await this.request(this.calendarPath, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      id: data.id,
      title: data.summary || data.subject || event.title,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      location: event.location,
      status: "confirmed",
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request(`${this.calendarPath}/${eventId}`, { method: "DELETE" });
  }
}
