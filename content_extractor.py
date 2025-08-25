
import os
import re
import logging
from typing import List, Tuple
from ebooklib import epub

def read_text_file(path: str) -> str:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def read_epub(path: str) -> str:
    book = epub.read_epub(path)
    texts = []
    for item in book.get_items_of_type(9):  # DOCUMENT
        try:
            content = item.get_body_content().decode('utf-8', errors='ignore')
            # strip HTML tags very simply
            text = re.sub(r'<[^>]+>', '', content)
            texts.append(text)
        except Exception:
            continue
    return "\n\n".join(texts)

def extract_text(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == '.txt':
        return read_text_file(path)
    elif ext == '.epub':
        return read_epub(path)
    else:
        raise ValueError('Unsupported file type: ' + ext)

CHAPTER_PATTERNS = [
    r'^(chapter\s+\d+\b.*)$',
    r'^(\d+\.\s+.*)$',
    r'^(prologue|epilogue)\b.*$',
    r'^(第\s*\d+\s*章.*)$',
]

def split_into_chapters(text: str) -> List[Tuple[str, str]]:
    lines = text.splitlines()
    chapters = []
    current_title = None
    buf = []
    import re as _re
    def flush():
        nonlocal buf, current_title
        if buf:
            content = "\n".join(buf).strip()
            if content:
                chapters.append((current_title or f"Chapter {len(chapters)+1}", content))
        buf = []

    for ln in lines:
        line = ln.strip()
        if not line:
            buf.append(ln)
            continue
        is_header = False
        for pat in CHAPTER_PATTERNS:
            if _re.match(pat, line, _re.I):
                flush()
                current_title = line
                is_header = True
                break
        if not is_header:
            buf.append(ln)
    flush()

    # Fallback: if only 1 chapter and it's huge, split every ~3k chars
    if len(chapters) <= 1 and len(text) > 4000:
        chapters = []
        chunk_size = 3500
        t = text.strip()
        i = 0
        order = 1
        while i < len(t):
            j = min(i + chunk_size, len(t))
            # prefer to split on paragraph boundary
            k = t.rfind("\n\n", i, j)
            if k == -1 or k <= i + 1000:
                k = j
            chunk = t[i:k].strip()
            chapters.append((f"Part {order}", chunk))
            order += 1
            i = k
    return chapters
