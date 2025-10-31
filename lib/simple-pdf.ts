function pad(number: number) {
  return number.toString().padStart(10, "0")
}

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

export function createSimplePdf({
  title,
  lines,
}: {
  title: string
  lines: string[]
}): Buffer {
  const header = "%PDF-1.4\n"
  const objects: string[] = []
  const offsets: number[] = [0]

  function addObject(content: string) {
    const id = objects.length + 1
    const object = `${id} 0 obj\n${content}\nendobj\n`
    const previous = objects.join("")
    const offset = header.length + previous.length
    offsets.push(offset)
    objects.push(object)
    return id
  }

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

  const textLines: string[] = []
  textLines.push("BT")
  textLines.push("/F1 20 Tf")
  textLines.push("72 770 Td")
  textLines.push(`(${escapePdfText(title)}) Tj`)
  textLines.push("/F1 12 Tf")
  let offsetY = 30
  for (const line of lines) {
    const escaped = escapePdfText(line)
    textLines.push(`0 -${offsetY} Td`)
    textLines.push(`(${escaped}) Tj`)
    offsetY = 18
  }
  textLines.push("ET")
  const textStream = textLines.join("\n")
  const streamContent = `<< /Length ${textStream.length} >>\nstream\n${textStream}\nendstream`
  const contentId = addObject(streamContent)

  const pageId = addObject(
    `<< /Type /Page /Parent 4 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
  )

  const pagesId = addObject(`<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`)

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)

  const body = objects.join("")
  const xrefOffset = header.length + body.length
  const xrefEntries = offsets
    .map((value) => `${pad(value)} 00000 n \n`)
    .join("")

  const xrefTable = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xrefEntries}`
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const pdfString = header + body + xrefTable + "\n" + trailer
  return Buffer.from(pdfString, "utf-8")
}
