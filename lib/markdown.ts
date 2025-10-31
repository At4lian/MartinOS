const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, (char) => escapeMap[char])
}

function formatInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+?)`/g, "<code>$1</code>")
}

function renderList(lines: string[]): string {
  const items = lines
    .map((line) => line.replace(/^[-*+]\s*/, "").trim())
    .map((line) => `<li>${formatInline(escapeHtml(line))}</li>`)
    .join("")
  return `<ul>${items}</ul>`
}

export function markdownToHtml(markdown: string): string {
  const paragraphs: string[] = []
  const lines = markdown.split(/\r?\n/)
  let buffer: string[] = []
  let listBuffer: string[] = []

  function flushBuffer() {
    if (buffer.length) {
      const content = buffer.join(" ").trim()
      if (content) {
        paragraphs.push(`<p>${formatInline(escapeHtml(content))}</p>`)
      }
      buffer = []
    }
  }

  function flushList() {
    if (listBuffer.length) {
      paragraphs.push(renderList(listBuffer))
      listBuffer = []
    }
  }

  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      flushList()
      flushBuffer()
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingMatch) {
      flushList()
      flushBuffer()
      const level = headingMatch[1].length
      const content = formatInline(escapeHtml(headingMatch[2].trim()))
      paragraphs.push(`<h${level}>${content}</h${level}>`)
      continue
    }

    if (/^[-*+]\s+/.test(line)) {
      flushBuffer()
      listBuffer.push(line)
      continue
    }

    buffer.push(line.trim())
  }

  flushList()
  flushBuffer()

  return paragraphs.join("")
}
