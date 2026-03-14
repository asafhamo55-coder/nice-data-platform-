import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ScoreGauge } from "../score-gauge";

describe("ScoreGauge", () => {
  it("renders the score number", () => {
    const { getByText } = render(<ScoreGauge score={75} />);
    expect(getByText("75")).toBeInTheDocument();
  });

  it("renders SVG with correct size", () => {
    const { container } = render(<ScoreGauge score={50} size={100} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute("width")).toBe("100");
    expect(svg!.getAttribute("height")).toBe("100");
  });

  it("uses emerald color for score >= 75", () => {
    const { container } = render(<ScoreGauge score={80} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    expect(progressCircle.getAttribute("stroke")).toBe("#10b981");
  });

  it("uses blue color for score 50-74", () => {
    const { container } = render(<ScoreGauge score={60} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    expect(progressCircle.getAttribute("stroke")).toBe("#2E75B6");
  });

  it("uses amber color for score 25-49", () => {
    const { container } = render(<ScoreGauge score={30} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    expect(progressCircle.getAttribute("stroke")).toBe("#f59e0b");
  });

  it("uses red color for score < 25", () => {
    const { container } = render(<ScoreGauge score={10} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    expect(progressCircle.getAttribute("stroke")).toBe("#f87171");
  });

  it("renders with default size of 56", () => {
    const { container } = render(<ScoreGauge score={50} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe("56px");
    expect(wrapper.style.height).toBe("56px");
  });

  it("calculates correct stroke dash array for full score", () => {
    const size = 56;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference; // 100% = full circumference

    const { container } = render(<ScoreGauge score={100} size={size} strokeWidth={strokeWidth} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    const dashArray = progressCircle.getAttribute("stroke-dasharray");
    // Should be "circumference 0"
    expect(dashArray).toBe(`${progress} 0`);
  });

  it("calculates correct stroke dash array for zero score", () => {
    const size = 56;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const { container } = render(<ScoreGauge score={0} size={size} strokeWidth={strokeWidth} />);
    const progressCircle = container.querySelectorAll("circle")[1];
    const dashArray = progressCircle.getAttribute("stroke-dasharray");
    expect(dashArray).toBe(`0 ${circumference}`);
  });
});
