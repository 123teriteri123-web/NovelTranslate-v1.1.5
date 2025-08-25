import re

def split_into_chapters(text):
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')

    # Regex patterns for chapter headers
    patterns = [
        r'^(Chapter\s+\d+)',          # Chapter 12
        r'^(Prologue|Epilogue|Interlude)',
        r'^(Act\s+\d+|Part\s+\d+)', 
        r'^(第\s*\d+\s*章)',         # Chinese/Japanese 第1章
        r'^(제\s*\d+\s*장)',         # Korean 제1장
        r'^(卷\s*\d+)',              # Chinese 卷1
        r'^(Arc\s+\d+)',             
    ]
    regex = re.compile("|".join(patterns), re.IGNORECASE | re.MULTILINE)

    # Find all matches
    matches = list(regex.finditer(text))
    chapters = []

    if matches:
        for i, m in enumerate(matches):
            start = m.start()
            end = matches[i+1].start() if i+1 < len(matches) else len(text)
            chunk = text[start:end].strip()
            if chunk:
                chapters.append(chunk)
    else:
        # fallback: split every ~4000 chars
        size = 4000
        for i in range(0, len(text), size):
            chapters.append(text[i:i+size].strip())

    return chapters
