function cssEscape(value: string): string {
  if ("CSS" in window && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function classSelector(element: Element): string {
  const classes = Array.from(element.classList)
    .filter((name) => !name.startsWith("wp-") && name.length < 48)
    .slice(0, 3);

  return classes.length > 0 ? `.${classes.map(cssEscape).join(".")}` : "";
}

function nthOfType(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tag;

  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === element.tagName
  );
  const index = siblings.indexOf(element) + 1;
  return `${tag}:nth-of-type(${index})`;
}

export function getStableSelector(element: Element): string {
  const id = element.getAttribute("id");
  if (id) return `#${cssEscape(id)}`;

  const testId = element.getAttribute("data-testid") || element.getAttribute("data-test");
  if (testId) return `[data-testid="${cssEscape(testId)}"]`;

  const aria = element.getAttribute("aria-label");
  if (aria) return `${element.tagName.toLowerCase()}[aria-label="${cssEscape(aria)}"]`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body && parts.length < 4) {
    const className = classSelector(current);
    parts.unshift(className ? `${current.tagName.toLowerCase()}${className}` : nthOfType(current));
    current = current.parentElement;
  }

  return parts.length > 0 ? parts.join(" > ") : element.tagName.toLowerCase();
}

export function getElementLabel(element: Element): string {
  const aria = element.getAttribute("aria-label");
  if (aria) return aria;

  const heading = element.querySelector("h1,h2,h3");
  if (heading?.textContent?.trim()) return heading.textContent.trim().slice(0, 64);

  const role = element.getAttribute("role");
  if (role) return `${role} area`;

  return `${element.tagName.toLowerCase()} section`;
}
