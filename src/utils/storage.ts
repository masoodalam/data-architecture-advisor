import type { Answers } from "../types";

const key = "data-architecture-advisor.answers";

export function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

export function saveAnswers(answers: Answers) {
  localStorage.setItem(key, JSON.stringify(answers));
}

export function clearAnswers() {
  localStorage.removeItem(key);
}
