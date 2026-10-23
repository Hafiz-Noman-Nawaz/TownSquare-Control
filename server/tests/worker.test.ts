import { describe, it, expect } from "vitest";
import { calculateBackoffMs, buildNotificationEmailHtml } from "../worker/index";

describe("Notification Outbox Worker & Email Delivery Engine", () => {
  it("should calculate progressive exponential backoff with jitter", () => {
    const delay1 = calculateBackoffMs(1);
    const delay2 = calculateBackoffMs(2);
    const delay3 = calculateBackoffMs(3);

    // Attempt 1: 2^1 * 1000 = 2000ms + [0-1000]ms => 2000 - 3000ms
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay1).toBeLessThanOrEqual(3000);

    // Attempt 2: 2^2 * 1000 = 4000ms + [0-1000]ms => 4000 - 5000ms
    expect(delay2).toBeGreaterThanOrEqual(4000);
    expect(delay2).toBeLessThanOrEqual(5000);

    // Attempt 3: 2^3 * 1000 = 8000ms + [0-1000]ms => 8000 - 9000ms
    expect(delay3).toBeGreaterThanOrEqual(8000);
    expect(delay3).toBeLessThanOrEqual(9000);
  });

  it("should generate branded English HTML and plain-text email templates", () => {
    const payload = {
      ticket_number: "TS-20261023-0099",
      zone_name: "Zone 1 - Main Boulevard & Retail",
      category_name: "CCTV Camera",
      camera_number: "CAM-01",
      exact_location: "Gatehouse A",
      priority: "high",
      description: "Severe image distortion after rain.",
      portal_link: "https://control.townsquare.ae/contractor/incidents/inc-test",
    };

    const email = buildNotificationEmailHtml(payload, "en");
    expect(email.subject).toContain("TS-20261023-0099");
    expect(email.subject).toContain("HIGH");
    expect(email.html).toContain("TOWN SQUARE CONTROL");
    expect(email.html).toContain("CAM-01");
    expect(email.html).toContain("Gatehouse A");
    expect(email.text).toContain("https://control.townsquare.ae/contractor/incidents/inc-test");
  });

  it("should generate branded Arabic RTL email templates", () => {
    const payload = {
      ticket_number: "TS-20261023-0099",
      zone_name: "المنطقة 1 - البوليفارد الرئيسي",
      category_name: "كاميرات المراقبة",
      exact_location: "بوابة أ",
      priority: "high",
      description: "انقطاع البث المباشر",
      portal_link: "https://control.townsquare.ae/contractor/incidents/inc-test",
    };

    const email = buildNotificationEmailHtml(payload, "ar");
    expect(email.subject).toContain("تاون سكوير");
    expect(email.subject).toContain("TS-20261023-0099");
    expect(email.html).toContain('dir="rtl"');
    expect(email.html).toContain("فتح البوابة لتقديم التقرير");
  });
});
